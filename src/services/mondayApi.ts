// Monday.com API service
import { mapColorToMonday } from '../utils/colorMapping';

const MONDAY_API_ENDPOINT = import.meta.env.VITE_MONDAY_API_ENDPOINT || 'https://api.monday.com/v2';
const MONDAY_API_VERSION = import.meta.env.VITE_MONDAY_API_VERSION || '2025-10';
const MONDAY_WORKSPACE_ID = import.meta.env.VITE_MONDAY_WORKSPACE_ID;

interface MondayResponse {
  data: any;
  errors?: Array<{ message: string }>;
}

class MondayApiService {
  private async makeRequest(query: string, variables: any = {}): Promise<any> {
    const token = import.meta.env.VITE_MONDAY_API_TOKEN;
    
    if (!token) {
      throw new Error('Monday API token not configured');
    }

    const response = await fetch(MONDAY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'API-Version': MONDAY_API_VERSION,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result: MondayResponse = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  }

  async createBoard(name: string, description: string = ''): Promise<any> {
    const mutation = `
      mutation CreateBoard($name: String!, $description: String, $workspaceId: ID) {
        create_board(
          board_name: $name,
          description: $description,
          board_kind: public,
          workspace_id: $workspaceId
        ) {
          id
          name
          description
        }
      }
    `;

    const result = await this.makeRequest(mutation, {
      name,
      description,
      workspaceId: MONDAY_WORKSPACE_ID,
    });

    // Create columns in the correct order: Statut, Personne, then Échéances
    if (result.create_board?.id) {
      try {
        // Create Status column first
        await this.createColumn(result.create_board.id, 'Statut', 'status');
        console.log('✅ Status column "Statut" created successfully');
        
        // Create Person column second
        await this.createColumn(result.create_board.id, 'Personne', 'people');
        console.log('✅ People column "Personne" created successfully');
        
        // Create Timeline column last (after Personne)
        await this.createColumn(result.create_board.id, 'Échéances', 'timeline');
        console.log('✅ Timeline column "Échéances" created successfully');
      } catch (error) {
        console.warn('⚠️ Could not create columns:', error);
      }
    }

    return result;
  }


  // Utilise la fonction importée directement

  async createGroup(boardId: string, groupName: string, color?: string): Promise<any> {
    const mondayColor = color ? mapColorToMonday(color) : undefined;
    
    const mutation = `
      mutation CreateGroup($boardId: ID!, $groupName: String!, $groupColor: String) {
        create_group(
          board_id: $boardId,
          group_name: $groupName,
          group_color: $groupColor
        ) {
          id
          title
        }
      }
    `;

    return this.makeRequest(mutation, {
      boardId,
      groupName,
      groupColor: mondayColor,
    });
  }

  async createItem(boardId: string, groupId: string | null, itemName: string, columnValues: any = {}, dueDate?: string): Promise<any> {
    // Prepare column values with timeline if dueDate is provided
    const finalColumnValues = { ...columnValues };
    if (dueDate) {
      finalColumnValues['timeline'] = { from: dueDate, to: dueDate };
    }

    // If no groupId, create item without group (for subitem boards)
    if (!groupId) {
      const mutation = `
        mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON) {
          create_item(
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
            name
          }
        }
      `;

      return this.makeRequest(mutation, {
        boardId,
        itemName,
        columnValues: JSON.stringify(finalColumnValues),
      });
    }

    // Normal case with group
    const mutation = `
      mutation CreateItem($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON) {
        create_item(
          board_id: $boardId,
          group_id: $groupId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          name
        }
      }
    `;

    return this.makeRequest(mutation, {
      boardId,
      groupId,
      itemName,
      columnValues: JSON.stringify(finalColumnValues),
    });
  }

  async getBoards(): Promise<any> {
    const query = `
      query GetBoards($workspaceId: ID) {
        boards(workspace_ids: [$workspaceId]) {
          id
          name
          description
          state
          groups {
            id
            title
            items_page(limit: 50) {
              items {
                id
                name
                column_values {
                  id
                  text
                  type
                }
              }
            }
          }
        }
      }
    `;

    return this.makeRequest(query, {
      workspaceId: MONDAY_WORKSPACE_ID
    });
  }

  async getBoard(boardId: string): Promise<any> {
    const query = `
      query GetBoard($boardId: ID!) {
        boards(ids: [$boardId]) {
          id
          name
          description
          groups {
            id
            title
            items_page {
              items {
                id
                name
              }
            }
          }
        }
      }
    `;

    return this.makeRequest(query, { boardId });
  }

  async deleteGroup(boardId: string, groupId: string): Promise<any> {
    const mutation = `
      mutation DeleteGroup($boardId: ID!, $groupId: String!) {
        delete_group(
          board_id: $boardId,
          group_id: $groupId
        ) {
          id
        }
      }
    `;

    return this.makeRequest(mutation, {
      boardId,
      groupId,
    });
  }

  async getBoardGroups(boardId: string): Promise<any> {
    const query = `
      query GetBoardGroups($boardId: ID!) {
        boards(ids: [$boardId]) {
          id
          groups {
            id
            title
          }
        }
      }
    `;

    return this.makeRequest(query, { boardId });
  }

  async createColumn(boardId: string, title: string, columnType: string) {
    const query = `
      mutation CreateColumn($boardId: ID!, $title: String!, $columnType: ColumnType!) {
        create_column(board_id: $boardId, title: $title, column_type: $columnType) {
          id
          title
          type
        }
      }
    `;
    
    return this.makeRequest(query, { boardId, title, columnType });
  }

  async createSubItem(parentItemId: string, name: string, status: string = 'todo', assignedPerson: string = '', dueDate?: string): Promise<any> {

    // Prepare column values for sub-item
    const columnValues: any = {};
    if (dueDate) {
      columnValues['timeline'] = { from: dueDate, to: dueDate };
    }

    const mutation = `
      mutation CreateSubitem($parentItemId: ID!, $itemName: String!, $columnValues: JSON) {
        create_subitem(
          parent_item_id: $parentItemId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          name
          parent_item {
            id
          }
        }
      }
    `;
    
    try {
      const result = await this.makeRequest(mutation, { 
        parentItemId: parentItemId,
        itemName: name,
        columnValues: JSON.stringify(columnValues)
      });
      
      return result;
    } catch (error) {
      console.error('Error creating sub-item:', error);
      throw error;
    }
  }

  // Method to create items on a subitems board (creates parent items)
  async createParentItem(boardId: string, itemName: string): Promise<any> {
    const mutation = `
      mutation CreateParentItem($boardId: ID!, $itemName: String!) {
        create_item(
          board_id: $boardId,
          item_name: $itemName
        ) {
          id
          name
        }
      }
    `;

    return this.makeRequest(mutation, {
      boardId,
      itemName,
    });
  }

  async updateSubItem(subItemId: string, name?: string, status?: string, assignedPerson?: string, dueDate?: string): Promise<any> {
    const mutation = `
      mutation UpdateSubItem($subItemId: ID!, $name: String) {
        change_subitem_value(
          item_id: $subItemId,
          column_id: "name",
          value: $name
        ) {
          id
        }
      }
    `;
    
    return this.makeRequest(mutation, { 
      subItemId, 
      name
    });
  }

  async deleteSubItem(subItemId: string): Promise<any> {
    const mutation = `
      mutation DeleteSubItem($subItemId: ID!) {
        delete_item(item_id: $subItemId) {
          id
        }
      }
    `;
    
    return this.makeRequest(mutation, { subItemId });
  }

  async archiveBoard(boardId: string): Promise<any> {
    const mutation = `
      mutation ArchiveBoard($boardId: ID!) {
        archive_board(board_id: $boardId) {
          id
          state
        }
      }
    `;
    
    return this.makeRequest(mutation, { boardId });
  }
}

export const mondayApi = new MondayApiService();

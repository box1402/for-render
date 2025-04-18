import { VideoSyncAction } from "@shared/schema";

const RECONNECT_INTERVAL = 5000; // 5 seconds

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private isConnecting: boolean = false;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private statusHandlers: Set<(status: 'connected' | 'disconnected' | 'connecting') => void> = new Set();
  private roomId?: number;
  private token?: string;
  private userId?: string;

  constructor() {
    // Determine WebSocket URL based on current protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  // Connect to WebSocket server
  public connect(): Promise<boolean> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve(true);
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkStatus = () => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve(true);
          }
        };
        const checkInterval = setInterval(checkStatus, 100);
      });
    }

    this.isConnecting = true;
    this.notifyStatusChange('connecting');

    return new Promise((resolve) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.isConnecting = false;
          this.notifyStatusChange('connected');
          
          // If we have room info, authenticate immediately
          if (this.roomId && this.token) {
            this.authenticate(this.roomId, this.token);
          }
          
          resolve(true);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle auth_result message specially
            if (data.type === 'auth_result' && data.success) {
              this.userId = data.userId;
            }
            
            // Dispatch to appropriate handlers
            this.messageHandlers.forEach((handler, type) => {
              if (data.type === type || (type === 'sync' && data.action)) {
                handler(data);
              }
            });
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
          this.isConnecting = false;
          this.socket = null;
          this.notifyStatusChange('disconnected');
          this.scheduleReconnect();
          resolve(false);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.notifyStatusChange('disconnected');
          resolve(false);
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.isConnecting = false;
        this.notifyStatusChange('disconnected');
        this.scheduleReconnect();
        resolve(false);
      }
    });
  }

  // Authenticate with the WebSocket server
  public authenticate(roomId: number, token: string): void {
    this.roomId = roomId;
    this.token = token;
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'auth',
        roomId,
        token
      }));
    }
  }

  // Send video sync action
  public sendSyncAction(action: VideoSyncAction): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.roomId) {
      this.socket.send(JSON.stringify({
        type: 'sync',
        action,
        roomId: this.roomId
      }));
    } else {
      console.warn('Cannot send sync action: WebSocket not connected');
    }
  }

  // Register message handler
  public on(type: string, handler: (data: any) => void): () => void {
    this.messageHandlers.set(type, handler);
    return () => this.messageHandlers.delete(type);
  }

  // Register connection status handler
  public onStatusChange(handler: (status: 'connected' | 'disconnected' | 'connecting') => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  // Notify all status handlers
  private notifyStatusChange(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.statusHandlers.forEach(handler => handler(status));
  }

  // Disconnect WebSocket
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.roomId = undefined;
    this.token = undefined;
    this.userId = undefined;
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (!this.reconnectTimer && this.roomId) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = undefined;
        this.connect();
      }, RECONNECT_INTERVAL);
    }
  }

  // Get current user ID
  public getUserId(): string | undefined {
    return this.userId;
  }

  // Get connection status
  public getStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (this.isConnecting) return 'connecting';
    return this.socket?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected';
  }
}

// Create singleton instance
export const websocket = new WebSocketClient();

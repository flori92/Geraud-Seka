import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications?limit=20`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    }
  }, [API_BASE_URL, getHeaders]);

  useEffect(() => {
    fetchNotifications();
    
    // Polling toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    // WebSocket pour temps réel
    const userId = localStorage.getItem("seka_user_id");
    if (userId) {
      try {
        const ws = new WebSocket(`${API_BASE_URL.replace("http", "ws")}/api/v1/notifications/ws/${userId}`);
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            setNotifications(prev => [data.data, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        };
        
        return () => {
          ws.close();
          clearInterval(interval);
        };
      } catch (e) {
        console.log("WebSocket non disponible");
      }
    }
    
    return () => clearInterval(interval);
  }, [fetchNotifications, API_BASE_URL]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
        method: "PUT",
        headers: getHeaders()
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
        method: "PUT",
        headers: getHeaders()
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: "bg-blue-500",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
      lead: "bg-primary-500",
      opportunity: "bg-indigo-500",
      task: "bg-orange-500",
      email: "bg-pink-500"
    };
    return colors[type] || "bg-gray-500";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-accents-2 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 max-h-[500px] bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Tout marquer lu
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4 text-accents-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-accents-5">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b hover:bg-accents-1 transition-colors ${
                      !notif.is_read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(notif.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notif.title}</p>
                        {notif.message && (
                          <p className="text-xs text-accents-5 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                        )}
                        <p className="text-xs text-accents-4 mt-1">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-1 hover:bg-accents-2 rounded"
                            title="Marquer comme lu"
                          >
                            <Check className="h-3 w-3 text-green-500" />
                          </button>
                        )}
                        {notif.action_url && (
                          <a
                            href={notif.action_url}
                            className="p-1 hover:bg-accents-2 rounded"
                            title="Voir"
                          >
                            <ExternalLink className="h-3 w-3 text-primary" />
                          </a>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 hover:bg-accents-2 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

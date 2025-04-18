import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { VideoContent, ContentListResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/utils";
import Header from "./Header";
import Footer from "./Footer";
import CreateRoomDialog from "./CreateRoomDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Film, Search, Plus, LogOut } from "lucide-react";

interface ContentBrowserProps {
  onLogout: () => void;
}

const ContentBrowser: React.FC<ContentBrowserProps> = ({ onLogout }) => {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContent, setSelectedContent] = useState<VideoContent | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all content
  const { data: contentData, isLoading, error } = useQuery<ContentListResponse>({
    queryKey: ['/api/content'],
  });

  // Handle error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading content",
        description: "Failed to load content. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filter content based on search term
  const filteredContent = searchTerm.trim() === "" 
    ? contentData?.content || []
    : contentData?.content?.filter((item: VideoContent) => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ) || [];

  // Group content by type (movies/shows)
  const movieContent: VideoContent[] = [];
  const showContent: VideoContent[] = [];
  
  if (contentData?.content) {
    contentData.content.forEach((item: VideoContent) => {
      if (item.contentType === "movie") {
        movieContent.push(item);
      } else if (item.contentType === "show") {
        showContent.push(item);
      }
    });
  }

  const handleContentClick = (content: VideoContent) => {
    setSelectedContent(content);
    setIsCreateRoomOpen(true);
  };

  const handleJoinRoomClick = () => {
    setLocation("/join");
  };

  const renderContentCard = (content: VideoContent) => (
    <div
      key={content.id}
      className="relative group cursor-pointer transition-all duration-300 overflow-hidden rounded-md shadow-md hover:shadow-lg"
      onClick={() => handleContentClick(content)}
    >
      <div className="aspect-video bg-neutral-800 relative overflow-hidden">
        {content.thumbnailKey ? (
          <img
            src={`/api/content/${content.id}/thumbnail`}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Film className="h-12 w-12 text-primary/50" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p className="text-white font-semibold text-sm line-clamp-1">{content.title}</p>
          <div className="flex justify-between items-center text-white/80 text-xs mt-1">
            <span>{content.duration ? formatDuration(content.duration) : "Unknown"}</span>
            <span className="capitalize">{content.contentType}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">Content Library</h1>
            <p className="text-neutral-600">Browse and create rooms to watch videos with a friend</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button onClick={handleJoinRoomClick}>
              Join Room
            </Button>
            
            <Button variant="outline" size="icon" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="w-full">
                <CardContent className="p-0">
                  <div className="aspect-video bg-neutral-200 animate-pulse rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchTerm.trim() !== "" ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            {filteredContent.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredContent.map((content: VideoContent) => renderContentCard(content))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500">No results found for "{searchTerm}"</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Movies Section */}
            {movieContent.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Movies</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movieContent.map((content: VideoContent) => renderContentCard(content))}
                </div>
              </div>
            )}
            
            {/* Shows Section */}
            {showContent.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">TV Shows</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {showContent.map((content: VideoContent) => renderContentCard(content))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
      
      {selectedContent && (
        <CreateRoomDialog
          content={selectedContent}
          open={isCreateRoomOpen}
          onOpenChange={setIsCreateRoomOpen}
        />
      )}
    </div>
  );
};

export default ContentBrowser;
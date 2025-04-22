
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChartBar, ImageIcon, Clock, Tags, BarChart2, TrendingUp } from 'lucide-react';
import { useImageStore } from "@/hooks/useImageStore";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const StatisticsPage = () => {
  const { images } = useImageStore();
  
  // Calculate statistics
  const allTags = images.reduce((acc, img) => acc + img.tags.length, 0);
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentImages = images.filter(img => img.uploadDate > last24Hours).length;

  const stats = {
    totalImages: images.length,
    totalTags: allTags,
    recentUploads: recentImages,
    avgTagsPerImage: images.length ? Number((allTags / images.length).toFixed(1)) : 0,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-photo-blue">Gallery Statistics</h1>
        <Link to="/">
          <Button variant="outline">Back to Gallery</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Images</p>
                <h3 className="text-2xl font-bold">{stats.totalImages}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tags className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tags</p>
                <h3 className="text-2xl font-bold">{stats.totalTags}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Uploads</p>
                <h3 className="text-2xl font-bold">{stats.recentUploads}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart2 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Tags/Image</p>
                <h3 className="text-2xl font-bold">{stats.avgTagsPerImage}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {images.length === 0 && (
        <div className="text-center mt-12 bg-gray-50 p-8 rounded-lg">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-xl text-muted-foreground">
            Upload some images to see your gallery statistics
          </p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Go to Gallery</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;

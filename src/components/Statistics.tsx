
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChartBar, ImageIcon, Clock, Tags } from 'lucide-react';

interface StatisticsProps {
  images: Array<{
    tags: string[];
    uploadDate: Date;
  }>;
}

const Statistics = ({ images }: StatisticsProps) => {
  const [stats, setStats] = useState({
    totalImages: 0,
    totalTags: 0,
    recentUploads: 0,
    avgTagsPerImage: 0,
  });

  useEffect(() => {
    // Calculate statistics
    const allTags = images.reduce((acc, img) => acc + img.tags.length, 0);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentImages = images.filter(img => img.uploadDate > last24Hours).length;

    setStats({
      totalImages: images.length,
      totalTags: allTags,
      recentUploads: recentImages,
      avgTagsPerImage: images.length ? Number((allTags / images.length).toFixed(1)) : 0,
    });
  }, [images]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white/50 backdrop-blur-sm border border-white/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg transition-colors group-hover:bg-purple-200">
                <ImageIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Images</p>
                <h3 className="text-2xl font-bold text-purple-600">{stats.totalImages}</h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white/50 backdrop-blur-sm border border-white/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg transition-colors group-hover:bg-blue-200">
                <Tags className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tags</p>
                <h3 className="text-2xl font-bold text-blue-600">{stats.totalTags}</h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white/50 backdrop-blur-sm border border-white/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg transition-colors group-hover:bg-green-200">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Uploads</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.recentUploads}</h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white/50 backdrop-blur-sm border border-white/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg transition-colors group-hover:bg-orange-200">
                <ChartBar className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Tags/Image</p>
                <h3 className="text-2xl font-bold text-orange-600">{stats.avgTagsPerImage}</h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;

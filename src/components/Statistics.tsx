
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
              <ImageIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Images</p>
              <h3 className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                {stats.totalImages}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
              <Tags className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tags</p>
              <h3 className="text-2xl font-bold text-blue-500 dark:text-blue-400">
                {stats.totalTags}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
              <Clock className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recent</p>
              <h3 className="text-2xl font-bold text-green-500 dark:text-green-400">
                {stats.recentUploads}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
              <ChartBar className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Tags</p>
              <h3 className="text-2xl font-bold text-orange-500 dark:text-orange-400">
                {stats.avgTagsPerImage}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;

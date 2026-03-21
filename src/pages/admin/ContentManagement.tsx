import { useEffect, useState } from 'react';
import {
  FileEdit,
  Plus,
  Link2,
  Calendar,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ContentItem {
  id: number;
  title: string;
  url: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

const ContentManagement = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    url: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContents();
    }, searchTerm ? 400 : 0);

    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const loadContents = async () => {
    try {
      setLoading(true);
      const response = await api.getContents({ page, limit: 20 });

      if (response.success && response.data) {
        let items = response.data.contents || [];

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          items = items.filter(
            (item: ContentItem) =>
              item.title.toLowerCase().includes(term) ||
              item.url.toLowerCase().includes(term)
          );
        }

        setContents(items);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error loading contents:', error);
      toast.error(error.message || 'Failed to load contents');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (content?: ContentItem) => {
    if (content) {
      setSelectedContent(content);
      setFormData({
        title: content.title,
        url: content.url,
      });
    } else {
      setSelectedContent(null);
      setFormData({
        title: '',
        url: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedContent(null);
    setFormData({
      title: '',
      url: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error('Title and TikTok URL are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedContent) {
        await api.updateContent(selectedContent.id, {
          title: formData.title.trim(),
          url: formData.url.trim(),
        });
        toast.success('Content updated successfully');
      } else {
        await api.createContent({
          title: formData.title.trim(),
          url: formData.url.trim(),
        });
        toast.success('Content created successfully');
      }
      handleCloseDialog();
      loadContents();
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast.error(error.message || 'Failed to save content');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await api.deleteContent(deleteId);
      toast.success('Content deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      loadContents();
    } catch (error: any) {
      console.error('Error deleting content:', error);
      toast.error(error.message || 'Failed to delete content');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openTikTok = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            TikTok Content
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage TikTok video links shown in your store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by title or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 rounded-xl"
          />
          <Button
            onClick={() => handleOpenDialog()}
            className="whitespace-nowrap rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add TikTok Link
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      ) : contents.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center shadow-soft">
          <FileEdit className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg mb-4">
            No TikTok content added yet
          </p>
          <Button onClick={() => handleOpenDialog()} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Add First TikTok Link
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          <FileEdit className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground line-clamp-2">
                            {item.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <button
                          type="button"
                          onClick={() => openTikTok(item.url)}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Link2 className="h-4 w-4" />
                          <span className="truncate max-w-[220px] md:max-w-[320px] lg:max-w-[420px]">
                            {item.url}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground capitalize">
                          {item.platform}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {formatDate(item.updated_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleDeleteClick(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedContent ? 'Edit TikTok Link' : 'Add TikTok Link'}
            </DialogTitle>
            <DialogDescription>
              {selectedContent
                ? 'Update the details for this TikTok content.'
                : 'Add a new TikTok video link to feature in your store.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Short title for this TikTok video"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="rounded-xl"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">TikTok Video URL</Label>
              <Input
                id="url"
                placeholder="https://www.tiktok.com/..."
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                className="rounded-xl"
                disabled={isSubmitting}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : selectedContent ? (
                  'Update Content'
                ) : (
                  'Create Content'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete TikTok content?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              TikTok link from your store content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentManagement;



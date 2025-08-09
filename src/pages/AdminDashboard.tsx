import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Send,
  CheckCircle,
  Clock,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Plus,
  Image as ImageIcon,
  Video,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { getVendors, doc, updateDoc, db, sendMessage, debugVendorCollection, getDoc, setDoc } from '@/lib/firebase';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageDialog, setMessageDialog] = useState({ open: false, vendorId: '', vendorName: '' });
  const [messageContent, setMessageContent] = useState('');
  const [slideshow, setSlideshow] = useState({
    enabled: true,
    items: []
  });
  const [newSlide, setNewSlide] = useState({
    url: '',
    type: 'image',
    title: '',
    link: ''
  });
  const { t } = useLanguage();

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (passcode === 'admin2') {
      setIsAuthenticated(true);
      toast.success('Access granted!');
      loadVendors();
      loadSlideshow();
    } else {
      toast.error('Invalid passcode');
    }
  };

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const vendorsData = await getVendors();
      setVendors(vendorsData || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast.error('Failed to load vendors');
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSlideshow = async () => {
    try {
      const docRef = doc(db, 'slideshow', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSlideshow(docSnap.data());
      } else {
        await setDoc(docRef, {
          enabled: true,
          items: []
        });
      }
    } catch (error) {
      console.error('Error loading slideshow:', error);
      toast.error('Failed to load slideshow settings');
    }
  };

  const updateSlideshow = async () => {
    try {
      const docRef = doc(db, 'slideshow', 'settings');
      await updateDoc(docRef, slideshow);
      toast.success('Slideshow updated successfully!');
    } catch (error) {
      console.error('Error updating slideshow:', error);
      toast.error('Failed to update slideshow');
    }
  };

  const handleVerifyVendor = async (vendorId) => {
    try {
      const vendorRef = doc(db, 'vendors', vendorId);
      await updateDoc(vendorRef, {
        verified: true,
        verifiedAt: new Date()
      });
      toast.success('Vendor verified successfully!');
      loadVendors();
    } catch (error) {
      console.error('Error verifying vendor:', error);
      toast.error('Failed to verify vendor');
    }
  };

  const handleToggleVendorStatus = async (vendorId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const vendorRef = doc(db, 'vendors', vendorId);
      await updateDoc(vendorRef, { status: newStatus });
      
      toast.success(`Vendor ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      loadVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update vendor status');
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await sendMessage({
        senderId: 'admin',
        senderName: 'Admin',
        recipientId: messageDialog.vendorId,
        content: messageContent,
        type: 'admin_message'
      });
      
      toast.success('Message sent successfully!');
      setMessageDialog({ open: false, vendorId: '', vendorName: '' });
      setMessageContent('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <Card className="animate-scale-in">
            <CardHeader className="text-center px-4 sm:px-6">
              <div className="h-12 w-12 bg-destructive rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-destructive-foreground" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold">Admin Access</CardTitle>
              <CardDescription className="text-sm">
                Enter the admin passcode to continue
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passcode">Passcode</Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode"
                    required
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="w-full hover-scale">
                  Access Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage marketplace vendors and operations</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={loadVendors} 
              disabled={isLoading}
              className="hover-scale flex-1 sm:flex-none text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
              className="hover-scale flex-1 sm:flex-none text-sm"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Vendors</p>
                  <p className="text-lg sm:text-2xl font-bold">{vendors.length}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Verified Vendors</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {vendors.filter(v => v.verified).length}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Vendors</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {vendors.filter(v => v.status === 'active').length}
                  </p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-lg sm:text-2xl font-bold">125</p>
                </div>
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slideshow Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Homepage Slideshow</CardTitle>
            <CardDescription>Manage the slideshow on the homepage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="slideshow-toggle">Slideshow Status</Label>
              <Switch
                id="slideshow-toggle"
                checked={slideshow.enabled}
                onCheckedChange={(val) => setSlideshow({...slideshow, enabled: val})}
              />
            </div>

            <div className="space-y-4">
              <Label>Current Slides ({slideshow.items?.length || 0})</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {slideshow.items?.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted flex items-center justify-center rounded mb-2">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="font-medium truncate">{item.title}</p>
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = [...slideshow.items];
                            updated.splice(index, 1);
                            setSlideshow({...slideshow, items: updated});
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Add New Slide</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={newSlide.type}
                    onValueChange={(val) => setNewSlide({...newSlide, type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Image
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="Enter image/video URL"
                    value={newSlide.url}
                    onChange={(e) => setNewSlide({...newSlide, url: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title (Optional)</Label>
                  <Input
                    placeholder="Enter title"
                    value={newSlide.title}
                    onChange={(e) => setNewSlide({...newSlide, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link (Optional)</Label>
                  <Input
                    placeholder="Enter link URL"
                    value={newSlide.link}
                    onChange={(e) => setNewSlide({...newSlide, link: e.target.value})}
                  />
                </div>

                <Button
                  onClick={() => {
                    if (!newSlide.url) {
                      toast.error('Please enter a URL');
                      return;
                    }
                    setSlideshow({
                      ...slideshow,
                      items: [...(slideshow.items || []), {...newSlide}]
                    });
                    setNewSlide({
                      url: '',
                      type: 'image',
                      title: '',
                      link: ''
                    });
                  }}
                  className="hover-scale"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slide
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={updateSlideshow} className="hover-scale">
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Vendors Table */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Vendor Management</CardTitle>
                <CardDescription className="text-sm">Manage and verify marketplace vendors</CardDescription>
              </div>
              <Button onClick={loadVendors} disabled={isLoading} className="hover-scale w-full sm:w-auto text-sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="px-2 sm:px-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] text-xs sm:text-sm">Business Name</TableHead>
                    <TableHead className="min-w-[150px] text-xs sm:text-sm hidden sm:table-cell">Email</TableHead>
                    <TableHead className="min-w-[100px] text-xs sm:text-sm">Phone</TableHead>
                    <TableHead className="min-w-[100px] text-xs sm:text-sm hidden md:table-cell">Category</TableHead>
                    <TableHead className="min-w-[80px] text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="min-w-[80px] text-xs sm:text-sm">Active</TableHead>
                    <TableHead className="min-w-[100px] text-xs sm:text-sm hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="min-w-[120px] text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.length > 0 ? (
                    vendors.map((vendor) => (
                      <TableRow key={vendor.id} className="animate-fade-in">
                        <TableCell className="font-medium text-xs sm:text-sm">{vendor.businessName || 'N/A'}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{vendor.email || 'N/A'}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{vendor.phone || 'N/A'}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{vendor.category || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={vendor.verified ? "default" : "secondary"} className="text-xs">
                            {vendor.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={vendor.status === 'active'}
                              onCheckedChange={() => handleToggleVendorStatus(vendor.id, vendor.status)}
                            />
                            <span className="text-xs hidden sm:inline">
                              {vendor.status === 'active' ? 'On' : 'Off'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          {vendor.createdAt?.toDate ? 
                            vendor.createdAt.toDate().toLocaleDateString() : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            {!vendor.verified && (
                              <Button
                                size="sm"
                                onClick={() => handleVerifyVendor(vendor.id)}
                                className="hover-scale text-xs w-full sm:w-auto"
                              >
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Verify</span>
                              </Button>
                            )}
                            
                            <Dialog 
                              open={messageDialog.open && messageDialog.vendorId === vendor.id}
                              onOpenChange={(open) => 
                                setMessageDialog(open ? 
                                  { open: true, vendorId: vendor.id, vendorName: vendor.businessName } : 
                                  { open: false, vendorId: '', vendorName: '' }
                                )
                              }
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="hover-scale text-xs w-full sm:w-auto">
                                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">Message</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="mx-4 max-w-md sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="text-sm sm:text-base">Send Message to {vendor.businessName}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="message" className="text-sm">Message</Label>
                                    <Textarea
                                      id="message"
                                      value={messageContent}
                                      onChange={(e) => setMessageContent(e.target.value)}
                                      placeholder="Type your message here..."
                                      rows={4}
                                      className="w-full text-sm"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setMessageDialog({ open: false, vendorId: '', vendorName: '' });
                                        setMessageContent('');
                                      }}
                                      className="text-sm"
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSendMessage} className="hover-scale text-sm">
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Message
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                        {isLoading ? 'Loading vendors...' : 'No vendors found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
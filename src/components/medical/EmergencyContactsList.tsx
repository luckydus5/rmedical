import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Phone, Trash2, Star } from 'lucide-react';
import { useEmergencyContacts, useAddEmergencyContact, useDeleteRecord } from '@/hooks/useMedicalRecords';
import { toast } from 'sonner';

interface Props {
  patientId?: string;
  readOnly?: boolean;
}

export default function EmergencyContactsList({ patientId, readOnly = false }: Props) {
  const { data: contacts, isLoading } = useEmergencyContacts(patientId);
  const addContact = useAddEmergencyContact();
  const deleteRecord = useDeleteRecord();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: '',
    relationship: '',
    phone: '',
    email: '',
    is_primary: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContact.mutateAsync({
        contact_name: formData.contact_name,
        relationship: formData.relationship,
        phone: formData.phone,
        email: formData.email || null,
        is_primary: formData.is_primary,
      });
      toast.success('Contact added successfully');
      setOpen(false);
      setFormData({
        contact_name: '',
        relationship: '',
        phone: '',
        email: '',
        is_primary: false,
      });
    } catch (error) {
      toast.error('Failed to add contact');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync({ table: 'emergency_contacts', id });
      toast.success('Contact deleted');
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading contacts...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>People to contact in case of emergency</CardDescription>
        </div>
        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Emergency Contact</DialogTitle>
                <DialogDescription>Add someone to contact in emergencies</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Input
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="e.g., Spouse, Parent, Sibling"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_primary"
                    checked={formData.is_primary}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
                  />
                  <Label htmlFor="is_primary">Primary emergency contact</Label>
                </div>
                <Button type="submit" className="w-full" disabled={addContact.isPending}>
                  {addContact.isPending ? 'Adding...' : 'Add Contact'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!contacts?.length ? (
          <p className="text-center text-muted-foreground py-8">No emergency contacts added</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.contact_name}</span>
                    {contact.is_primary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <a href={`tel:${contact.phone}`} className="text-primary hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </a>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(contact.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

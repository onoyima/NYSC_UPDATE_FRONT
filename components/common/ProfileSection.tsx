'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Building,
  Camera
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/services/student.service';
import { authService } from '@/services/auth.service';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';
import { getInitials, formatDate } from '@/utils/formatters';

interface ProfileSectionProps {
  userType: 'student' | 'admin';
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ userType }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.fname || '',
    lastName: user?.lname || '',
    email: (user as any)?.email || '',
        phone: (user as any)?.phone || '',
        address: (user as any)?.address || '',
        bio: (user as any)?.bio || '',
    // Student specific
    matricNumber: (user as any)?.matric_no || '',
    institution: (user as any)?.institution || '',
    course: (user as any)?.course || '',
    // Admin specific
    department: (user as any)?.department || '',
    position: (user as any)?.position || '',
  });

  // Fetch comprehensive profile data
  useEffect(() => {
    if (userType === 'student') {
      fetchStudentProfileData();
    } else if (userType === 'admin') {
      fetchAdminProfileData();
    }
  }, [userType, fetchStudentProfileData]);

  const fetchStudentProfileData = async () => {
    setLoading(true);
    try {
      const response = await studentService.getProfile();
      setProfileData(response.data);
      
      // Update form data with comprehensive profile data
      const data = response.data;
      setFormData({
        firstName: data.student?.first_name || user?.fname || '',
        lastName: data.student?.last_name || user?.lname || '',
        email: data.student?.email || (user as any)?.email || '',
        phone: data.contact?.phone || (user as any)?.phone || '',
        address: data.contact?.address || (user as any)?.address || '',
        bio: data.student?.bio || (user as any)?.bio || '',
        matricNumber: data.student?.matric_no || '',
        institution: data.academic?.institution || '',
        course: data.academic?.course_study || '',
        department: typeof data.academic?.department === 'object' ? data.academic?.department?.name || '' : data.academic?.department || '',
        position: '',
      });
    } catch (error: any) {
      toast.error('Failed to load student profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminProfileData = async () => {
    setLoading(true);
    try {
      const response = await authService.getProfile();
      setProfileData(response);
      
      // Update form data with admin profile data
      const adminUser = response.user;
      setFormData({
        firstName: adminUser?.fname || '',
        lastName: adminUser?.lname || '',
        email: adminUser?.email || '',
        phone: adminUser?.phone || '',
        address: adminUser?.address || '',
        bio: (adminUser as any)?.bio || '',
        matricNumber: '',
        institution: '',
        course: '',
        department: (adminUser as any)?.department || '',
        position: (adminUser as any)?.title || '',
      });
    } catch (error: any) {
      toast.error('Failed to load admin profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (userType === 'admin') {
        // Save admin profile
        const profileData = {
          fname: formData.firstName,
          lname: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          department: formData.department,
        };
        
        await adminService.updateAdminProfile(profileData);
        toast.success('Admin profile updated successfully');
      } else {
        // Save student profile
        const profileData = {
          fname: formData.firstName,
          lname: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          matric_no: formData.matricNumber,
          institution: formData.institution,
          course: formData.course,
        };
        
        await studentService.updateProfile(profileData);
        toast.success('Student profile updated successfully');
      }
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      firstName: (user as any)?.fname || '',
      lastName: (user as any)?.lname || '',
      email: (user as any)?.email || '',
      phone: (user as any)?.phone || '',
      address: (user as any)?.address || '',
      bio: (user as any)?.bio || '',
      matricNumber: (user as any)?.matricNumber || (user as any)?.matric_no || '',
      institution: (user as any)?.institution || '',
      course: (user as any)?.course || '',
      department: (user as any)?.department || '',
      position: (user as any)?.position || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={(user as any)?.avatar} />
                  <AvatarFallback className="text-lg">
                    {user ? getInitials(
                      `${(user as any).fname || (user as any).firstName || ''} ${(user as any).lname || (user as any).lastName || ''}`.trim()
                    ) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user ? `${user.fname || ''} ${user.lname || ''}`.trim() || user.name || 'User' : 'User'}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {userType === 'admin' ? 'Administrator' : 'Student'}
                  </Badge>
                  {userType === 'student' && (user as any)?.matric_no && (
                    <Badge variant="outline">
                      {(user as any).matric_no}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            {isEditing ? 'Update your personal information' : 'Your personal details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{formData.firstName || 'Not provided'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{formData.lastName || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{formData.email || 'Not provided'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{formData.phone || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            {isEditing ? (
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
              />
            ) : (
              <p className="text-sm py-2">{formData.address || 'Not provided'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            {isEditing ? (
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-sm py-2">{formData.bio || 'No bio provided'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {userType === 'student' ? (
              <>
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </>
            ) : (
              <>
                <Building className="h-5 w-5" />
                Work Information
              </>
            )}
          </CardTitle>
          <CardDescription>
            {userType === 'student'
              ? 'Your academic and personal details'
              : 'Your administrative details'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {userType === 'student' ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="matricNumber">Matric Number</Label>
                  {isEditing ? (
                    <Input
                      id="matricNumber"
                      value={formData.matricNumber}
                      onChange={(e) => handleInputChange('matricNumber', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm py-2">{formData.matricNumber || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  {isEditing ? (
                    <Input
                      id="institution"
                      value={formData.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm py-2">{formData.institution || 'Not provided'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course of Study</Label>
                {isEditing ? (
                  <Input
                    id="course"
                    value={formData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                  />
                ) : (
                  <p className="text-sm py-2">{formData.course || 'Not provided'}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm py-2">{formData.department || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  {isEditing ? (
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm py-2">{formData.position || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Actions */}
      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;

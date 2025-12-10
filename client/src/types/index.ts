export interface User {
  id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'employer';
  profile?: {
    title?: string;
    skills?: string[];
    experience?: string;
    education?: Education[];
    resume?: {
      url: string;
      publicId: string;
    };
    profilePicture?: {
      url: string;
      publicId: string;
    };
    bio?: string;
    location?: string;
    phone?: string;
  };
  company?: {
    name: string;
    description: string;
    website: string;
    logo?: {
      url: string;
      publicId: string;
    };
    size: string;
    industry: string;
    founded: number;
  };
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  postedAt(postedAt: any): import("react").ReactNode;
  postedAt: any;
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  type: string;
  category: string;
  experience: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  applicationDeadline: string;
  employer: {
    id: string;
    _id: string;
    name: string;
    company: {
      location: ReactNode;
      description: string;
      website: any;
      name: string;
      logo?: {
        url: string;
      };
    };
  };
  status: string;
  views: number;
  applicationsCount: number;
  createdAt: string;
}

export interface Application {
  _id: string;
  job: Job;
  applicant: User;
  coverLetter: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'hired';
  statusHistory: StatusHistory[];
  notes: Note[];
  createdAt: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: number;
}

export interface StatusHistory {
  status: string;
  changedBy: string;
  date: string;
  note: string;
}

export interface Note {
  note: string;
  addedBy: string;
  date: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
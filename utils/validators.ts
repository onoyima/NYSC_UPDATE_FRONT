import * as yup from 'yup';

export const studentUpdateSchema = yup.object({
  surname: yup.string().required('Surname is required').min(2, 'Surname must be at least 2 characters'),
  firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  middleName: yup.string().optional(),
  phoneNumber: yup.string()
    .required('Phone number is required')
    .matches(/^(\+234|0)[789]\d{9}$/, 'Please enter a valid Nigerian phone number'),
  email: yup.string().required('Email is required').email('Please enter a valid email address'),
  bloodGroup: yup.string().oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 'Invalid blood group'),
  genotype: yup.string().oneOf(['AA', 'AS', 'AC', 'SS', 'SC', 'CC'], 'Invalid genotype'),
  disability: yup.string().optional(),
  emergencyContact: yup.object({
    name: yup.string().required('Emergency contact name is required'),
    relationship: yup.string().required('Relationship is required'),
    phoneNumber: yup.string()
      .required('Emergency contact phone is required')
      .matches(/^(\+234|0)[789]\d{9}$/, 'Please enter a valid Nigerian phone number'),
  }),
});

export const loginSchema = yup.object({
  identity: yup.string()
    .required('Matric number or email is required')
    .min(3, 'Please enter a valid matric number or email'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

// Legacy schemas for backward compatibility
export const adminLoginSchema = yup.object({
  email: yup.string().required('Email is required').email('Please enter a valid email address'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});
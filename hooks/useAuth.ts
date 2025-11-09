import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// This hook is a simple alias for the one exported from AuthContext
// to keep the pattern consistent with useTheme.
export { useAuth } from '../contexts/AuthContext';

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";


type AuthContextType = {
  isSignedIn: boolean;
  signIn: () => void;
  user: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isSignedIn, setIsSignedIn] = useState(false)
    const [user, setUser] = useState(null)

    useEffect(() => {
        const checkStatus = async() => {
            const storedState = await AsyncStorage.getItem('isSignedIn')
            const userJWT = await AsyncStorage.getItem('userJWT')
            const accessToken = await AsyncStorage.getItem('accessToken')

            if(storedState === 'true' && accessToken){
                setIsSignedIn(true)
            }
        }
        checkStatus()
    },[])

    const signIn = () => {
        setIsSignedIn(true)
        AsyncStorage.setItem('isSignedIn', 'true')
    }

    return (
        <AuthContext.Provider value={{ isSignedIn, signIn, user }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
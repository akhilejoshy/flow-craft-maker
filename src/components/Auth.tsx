import { Navigate } from "react-router-dom"


const Auth = ({ children, auth }: { children: any; auth: boolean }) => {
    const token = localStorage.getItem('token')
    if (auth) {
        if (token) {
            return children
        } else {
            return <Navigate to="/login" replace />
        }
    } if (!auth) {
        if (token) {
            return <Navigate to="/dashboard" replace />
        } else {
            return children
        }
    }
}
export default Auth
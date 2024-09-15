import axios from "axios";
const BASE_URL = 'http://localhost:3000';
import Cookies from "js-cookie";

const token = Cookies.get('jwt');

export default axios.create({
    baseURL: BASE_URL
})

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
})

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${token}`}
})
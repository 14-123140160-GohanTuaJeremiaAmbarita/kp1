import axios from "axios";

const api = axios.create({

    baseURL: "http://localhost:5000/api",

    timeout:45000

});

export default api;
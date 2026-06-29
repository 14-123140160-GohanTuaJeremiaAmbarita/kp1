import api from "./axios";

export async function sendMessage(

    message: string

) {

    const {

        data

    } = await api.post(

        "/chat",

        {

            message

        }

    );

    return data;

}
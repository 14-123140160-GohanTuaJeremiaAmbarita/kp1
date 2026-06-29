import { useState, type KeyboardEvent } from "react";

interface Props {

    onSend(text:string):void;

}

export default function ChatInput({

    onSend

}:Props){

    const [text,setText]=useState("");

    function send(){

        if(!text.trim()) return;

        onSend(text);

        setText("");

    }

    function keyDown(

        e:KeyboardEvent<HTMLInputElement>

    ){

        if(e.key==="Enter"){

            send();

        }

    }

    return(

        <div className="chat-input">

            <input

                value={text}

                placeholder="Tanyakan Kepada Smart IT Assistant"

                onChange={(e)=>setText(e.target.value)}

                onKeyDown={keyDown}

            />

            <button

                onClick={send}

            >

                Kirim

            </button>

        </div>

    );

}
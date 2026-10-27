import { useCallback, useRef, useState } from "react";

export function useNote() {
    const [note, setNote] = useState(null);
    const timer = useRef(null);

    const show = useCallback((text, bad = false) => {
        clearTimeout(timer.current);
        setNote({ text, bad });
        timer.current = setTimeout(() => setNote(null), 3000);
    }, []);

    const view = note ? <div className={note.bad ? "toast bad" : "toast"}>{note.text}</div> : null;
    return [view, show];
}

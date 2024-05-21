import { useOthersConnectionIds } from "@liveblocks-config";
import { Cursor } from "./Cursor";

export function LiveCursors() {
    const others = useOthersConnectionIds();

    return (
        <>
            {others.map((connectionId) => (
                <Cursor key={connectionId} connectionId={connectionId} />
            ))}
        </>
    );
}

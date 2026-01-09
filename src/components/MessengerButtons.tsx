

type MessengerUser = {
    label: string;
    username: string;
};

const MESSENGER_USERS: MessengerUser[] = [
    { label: "Chat with Eirik", username: "cromkake" },
    { label: "Chat with Kurt", username: "lienkurt" },
];

function messengerLink(username: string, ref?: string) {
    const base = `https://m.me/${encodeURIComponent(username)}`;
    return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}

export function MessengerButtons() {
    const refTag = "from_eirik_kurt_site";

    return (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {MESSENGER_USERS.map((user) => (
                <a
                    key={user.username}
                    href={messengerLink(user.username, refTag)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${user.label} on Messenger`}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.25)",
                        textDecoration: "none",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    💬 {user.label}
                </a>
            ))}
        </div>
    );
}

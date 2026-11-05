// Who is connected, kept in this server's memory.
// One member can have several sockets (phone, desktop, extra tabs).
const createPresence = () => {
  const socketsByMember = new Map(); // memberId -> Set of socket ids

  return {
    add(memberId, socketId) {
      if (!socketsByMember.has(memberId)) {
        socketsByMember.set(memberId, new Set());
      }
      socketsByMember.get(memberId).add(socketId);
    },

    remove(memberId, socketId) {
      const sockets = socketsByMember.get(memberId);
      if (!sockets) {
        return;
      }
      sockets.delete(socketId);
      // only offline once their last socket is gone
      if (sockets.size === 0) {
        socketsByMember.delete(memberId);
      }
    },

    socketsFor(memberId) {
      return [...(socketsByMember.get(memberId) ?? [])];
    },

    onlineMemberCount() {
      return socketsByMember.size;
    },
  };
};

export default createPresence;

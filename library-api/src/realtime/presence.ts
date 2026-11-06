const createPresence = () => {
  const socketsByMember = new Map<string, Set<string>>();

  return {
    add(memberId: string, socketId: string) {
      const sockets = socketsByMember.get(memberId) ?? new Set<string>();
      sockets.add(socketId);
      socketsByMember.set(memberId, sockets);
    },

    remove(memberId: string, socketId: string) {
      const sockets = socketsByMember.get(memberId);
      if (!sockets) {
        return;
      }
      sockets.delete(socketId);
      if (sockets.size === 0) {
        socketsByMember.delete(memberId);
      }
    },

    onlineMemberCount() {
      return socketsByMember.size;
    },
  };
};

export default createPresence;

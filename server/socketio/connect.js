let usercolor = [
    "red", "blue", "yellow", "green", "purple", "white", "chocolate", "cyan"
  ]

let correct = {};
let skip = {}

module.exports = (app, socket)=>{


    socket.on("disconnect", (data)=>{
        console.log("disconnect",data);
    })

    socket.on("vote-skip", (data)=>{
        if(skip[data.title].findIndex(i => i === data.user.nickname) === -1){
            skip[data.title].push(data.user.nickname);
            app.io.in(data.title).emit("notice-skip", {num : skip[data.title].length})
        }
            
        if(skip[data.title].length === room.rooms[data.idx].users.length){
            room.rooms[data.idx].Song[room.rooms[data.idx].songN[0]]
            app.io.in(data.title).emit("skipped", {
                data : "skip"
            });
        }
    })

    socket.on("send-chat", (data)=>{
        app.io.in(data.title).emit("receive-chat", data)

        room.rooms[data.idx].Song[room.rooms[data.idx].songN[0]].ans.map((i)=>{
            if(i===data.chat && !correct[data.title]){
                correct[data.title] = true;
                // to increase user score
                let usIdx = room.rooms[data.idx].users.findIndex(i => i.nickname===data.user.nickname)
                if(usIdx !== -1){
                    room.rooms[data.idx].users[usIdx].score += 1;
                    app.io.in(data.title).emit("correct", {
                        room : room.rooms[data.idx],
                        user : data.user
                    })
                }
            }
        })
    })
    // start game
    socket.on("req-start-game", (data)=>{
        correct[data.title] = false;
        skip[data.title] = [];
        if (data.first !== -1){
            console.log(room.rooms[data.idx].songN[0], room.rooms[data.idx].songN[1])
            if(room.rooms[data.idx].songN[0] === room.rooms[data.idx].songN[1]-1){
                room.rooms[data.idx].Song[room.rooms[data.idx].Song.length-1].duration = 9999;
                room.rooms[data.idx].Song[room.rooms[data.idx].Song.length-1].hint[0].time = 9998;
                room.rooms[data.idx].Song[room.rooms[data.idx].Song.length-1].hint[0].category = "게임 상태";
                room.rooms[data.idx].Song[room.rooms[data.idx].Song.length-1].hint[0].context = "게임 종료";
            }
            else{
                room.rooms[data.idx].songN[0] += 1;
            }
            app.io.in(data.title).emit("end-game", {
                room : room.rooms[data.idx]
            })
        }
        setTimeout(()=>{
            app.io.in(data.title).emit("res-start-game")
        },3500)
        
    })
    // join room
    socket.on("join-room", (data)=>{
        socket.join(data.title);
        // check answer
        correct[data.title] = false;
        skip[data.title] = [];
    })


    // Add user
    socket.on("req-add-user", (data)=>{
        let idx = room.rooms.findIndex(i => i.title === data.room.title)
        let userN = room.rooms[idx].users.length
        let user = {
            nickname : data.username,
            color : usercolor[userN],
            roomMaster : false,
            score : 0
        }
        if(userN == 0) user.roomMaster = true;

        room.rooms[idx].users.push(user);

        app.io.in(data.room.title).emit("res-add-user", room.rooms[idx])
    })

    // Remove user    
    socket.on("remove-user", (data)=>{
        let idx = room.rooms.findIndex(i => i.title === data.room.title)
        let usrIdx = room.rooms[idx].users.findIndex(i => i.nickname === data.username)
        room.rooms[idx].users.splice(usrIdx, 1);

        if(usrIdx === 0 && room.rooms[idx].users.length > 0){
            room.rooms[idx].users[0].roomMaster = true;
        }
        console.log("disconnected : ", room.rooms[idx].users)

        app.io.in(data.room.title).emit("remove-user", room.rooms[idx]);

        if(room.rooms[idx].users.length === 0){
            room.rooms.splice(idx, 1)
        }
    })

}
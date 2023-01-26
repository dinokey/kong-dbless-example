const grpc = require("@grpc/grpc-js");
const PROTO_PATH = __dirname + "/member.proto";
var protoLoader = require("@grpc/proto-loader");

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};
var packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
const memberProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();
let memberList = [
  { id: "1", name: "Dinokey", place: "Jakarta", hobby: "Sleep" },
  { id: "2", name: "John Doe", place: "Malang", hobby: "Running" },
];

server.addService(memberProto.member.MemberService.service, {
  getMember: (call, callback) => {
    console.log("getMember called!");
    const memberId = call.request.id;
    const member = memberList.find((nItem) => nItem.id == memberId);
    callback(null, member);
  },

  getAllMembers: (_, callback) => {
    console.log("getAllMembers called!");
    callback(null, { members: memberList });
  },

  addMember: (call, callback) => {
    console.log("addMember called!");
    const member = {
      id: Date.now(),
      name: call.request.name,
      place: call.request.place,
      hobby: call.request.hobby,
    };
    memberList.push(member);
    callback(null, { members: memberList });
  },

  deleteMember: (call, callback) => {
    console.log("deleteMember called!");
    const idWantToDelete = call.request.id;
    memberList = memberList.filter((member) => member.id !== idWantToDelete);
    callback(null, { members: memberList });
  },

  editMember: (call, callback) => {
    console.log("editMember called!");
    const memberId = call.request.id;
    const member = memberList.find((member) => member.id == memberId);
    member.name = call.request.name;
    member.place = call.request.place;
    member.hobby = call.request.hobby;
    callback(null, member);
  },
});

server.bindAsync(
  "127.0.0.1:50051",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    console.log("Server running at 127.0.0.1:50051");
    server.start();
  }
);
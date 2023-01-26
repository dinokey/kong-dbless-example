const grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = __dirname + "/member.proto";

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};
var packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

const MemberService = grpc.loadPackageDefinition(packageDefinition).member.MemberService;

const client = new MemberService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

client.getAllMembers({}, (error, member) => {
  if (!error) {
    console.log("get All Members");
    console.log(member);
    console.log("");
  } else throw error;
});

client.addMember(
  {
    name: "Tcala",
    place: "Wakanda",
    hobby: "Martial Arts",
  },
  (error, member) => {
    if (!error) {
      console.log("After add Tcala as member");
      console.log(member);
      console.log("");
    } else throw error;
  }
);

client.deleteMember({ id: "1" }, (error, member) => {
  if (!error) {
    console.log("deleted Member with id=1");
    console.log(member);
    console.log("");
  } else throw error;
});

client.editMember(
  {
    id: "2",
    name: "Zeus",
    place: "Atlantis",
    hobby: "Singing",
  },
  (error, member) => {
    if (!error) {
      console.log("Edited Member with id=2");
      console.log(member);
      console.log("");
    } else throw error;
  }
);

client.getMember({ id: "2" }, (error, member) => {
  if (!error) {
    console.log("Get member with id=2");
    console.log(member);
    console.log("");
  } else throw error;
});

const grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = __dirname + "/hotel.proto";

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};
var packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

const HotelService = grpc.loadPackageDefinition(packageDefinition).hotel.HotelService;

const client = new HotelService(
  "localhost:50052",
  grpc.credentials.createInsecure()
);

client.getAllHotels({}, (error, hotel) => {
  if (!error) {
    console.log("get All Hotels");
    console.log(hotel);
    console.log("");
  } else throw error;
});

client.addHotel(
  {
    name: "Mandala Hotel",
    location: "Malang",
  },
  (error, hotel) => {
    if (!error) {
      console.log("After add Mandala hotel");
      console.log(hotel);
      console.log("");
    } else throw error;
  }
);

client.deleteHotel({ id: "1" }, (error, hotel) => {
  if (!error) {
    console.log("deleted Hotel with id=1");
    console.log(hotel);
    console.log("");
  } else throw error;
});

client.editHotel(
  {
    id: "2",
    name: "Happy Hour Hotel",
    location: "Batu",
  },
  (error, hotel) => {
    if (!error) {
      console.log("Edited Hotel with id=2");
      console.log(hotel);
      console.log("");
    } else throw error;
  }
);

client.getHotel({ id: "2" }, (error, hotel) => {
  if (!error) {
    console.log("Get hotel with id=2");
    console.log(hotel);
    console.log("");
  } else throw error;
});

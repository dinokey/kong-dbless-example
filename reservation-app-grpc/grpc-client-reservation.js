const grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = __dirname + "/reservation.proto";

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};
var packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

const ReservationService = grpc.loadPackageDefinition(packageDefinition).reservation.ReservationService;

const client = new ReservationService(
  "localhost:50052",
  grpc.credentials.createInsecure()
);

client.getAllReservations({}, (error, reservation) => {
  if (!error) {
    console.log("get All Reservations");
    console.log(reservation);
    console.log("");
  } else throw error;
});

client.addReservation(
  {
    guestName: "Tcala",
    roomType: "President Suite",
  },
  (error, reservation) => {
    if (!error) {
      console.log("After add Tcala's reservation");
      console.log(reservation);
      console.log("");
    } else throw error;
  }
);

client.deleteReservation({ id: "1" }, (error, reservation) => {
  if (!error) {
    console.log("deleted Reservation with id=1");
    console.log(reservation);
    console.log("");
  } else throw error;
});

client.editReservation(
  {
    id: "2",
    guestName: "Zeus",
    roomType: "Luxury",
  },
  (error, reservation) => {
    if (!error) {
      console.log("Edited Reservation with id=2");
      console.log(reservation);
      console.log("");
    } else throw error;
  }
);

client.getReservation({ id: "2" }, (error, reservation) => {
  if (!error) {
    console.log("Get reservation with id=2");
    console.log(reservation);
    console.log("");
  } else throw error;
});

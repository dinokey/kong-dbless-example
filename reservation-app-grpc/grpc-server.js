const grpc = require("@grpc/grpc-js");
const PROTO_PATH = __dirname + "/reservation.proto";
const PROTO_PATH_2 = __dirname + "/hotel.proto";
var protoLoader = require("@grpc/proto-loader");

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};
var protoPaths = [PROTO_PATH, PROTO_PATH_2]
var packageDefinition = protoLoader.loadSync(protoPaths, options);
const protos = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();
let reservationList = [
  { id: "1", guestName: "Dinokey", roomType: "Suite"},
  { id: "2", guestName: "John Doe", roomType: "Deluxe" },
];

let hotelList = [
  { id: "1", name: "De Houtel", location: "Jakarta"},
  { id: "2", name: "The View", location: "Bandung" },
];

// Add Reservation Service
server.addService(protos.reservation.ReservationService.service, {
  getReservation: (call, callback) => {
    console.log("getReservation called!");
    const reservationId = call.request.id;
    const reservation = reservationList.find((nItem) => nItem.id == reservationId);
    callback(null, reservation);
  },

  getAllReservations: (_, callback) => {
    console.log("getAllReservations called!");
    callback(null, { reservations: reservationList });
  },

  addReservation: (call, callback) => {
    console.log("addReservation called!");
    const reservation = {
      id: Date.now(),
      guestName: call.request.guestName,
      roomType: call.request.roomType,
    };
    reservationList.push(reservation);
    callback(null, { reservations: reservationList });
  },

  deleteReservation: (call, callback) => {
    console.log("deleteReservation called!");
    const idWantToDelete = call.request.id;
    reservationList = reservationList.filter((reservation) => reservation.id !== idWantToDelete);
    callback(null, { reservations: reservationList });
  },

  editReservation: (call, callback) => {
    console.log("editReservation called!");
    const reservationId = call.request.id;
    const reservation = reservationList.find((reservation) => reservation.id == reservationId);
    reservation.guestName = call.request.guestName;
    reservation.roomType = call.request.roomType;
    callback(null, reservation);
  },
});

// Add Hotel Service
server.addService(protos.hotel.HotelService.service, {
  getHotel: (call, callback) => {
    console.log("getHotel called!");
    const hotelId = call.request.id;
    const hotel = hotelList.find((nItem) => nItem.id == hotelId);
    callback(null, hotel);
  },

  getAllHotels: (_, callback) => {
    console.log("getAllHotels called!");
    callback(null, { hotels: hotelList });
  },

  addHotel: (call, callback) => {
    console.log("addHotel called!");
    const hotel = {
      id: Date.now(),
      name: call.request.name,
      location: call.request.location,
    };
    hotelList.push(hotel);
    callback(null, { hotels: hotelList });
  },

  deleteHotel: (call, callback) => {
    console.log("deleteHotel called!");
    const idWantToDelete = call.request.id;
    hotelList = hotelList.filter((hotel) => hotel.id !== idWantToDelete);
    callback(null, { hotels: hotelList });
  },

  editHotel: (call, callback) => {
    console.log("editHotel called!");
    const hotelId = call.request.id;
    const hotel = hotelList.find((hotel) => hotel.id == hotelId);
    hotel.name = call.request.name;
    hotel.location = call.request.location;
    callback(null, hotel);
  },
});

server.bindAsync(
  "0.0.0.0:50052",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    console.log("Server running at 0.0.0.0:50052");
    server.start();
  }
);
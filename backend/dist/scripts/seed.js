"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_model_1 = require("../modules/auth/auth.model");
const property_model_1 = require("../modules/property/property.model");
const room_model_1 = require("../modules/room/room.model");
const inventory_slot_model_1 = require("../modules/inventory/inventory-slot.model");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../core/utils/logger");
/* ───────────────────────────────────────────────────────
   HELPER UTILITIES
   ─────────────────────────────────────────────────────── */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
    const copy = [...arr].sort(() => 0.5 - Math.random());
    return copy.slice(0, Math.min(n, copy.length));
};
const randBetween = (min, max) => Math.round(min + Math.random() * (max - min));
const randRating = (min, max) => +(min + Math.random() * (max - min)).toFixed(1);
const INDIA_CITIES = [
    { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lng: 72.8777, zip: '400001' },
    { name: 'Delhi', state: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025, zip: '110001' },
    { name: 'Bangalore', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946, zip: '560001' },
    { name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lng: 78.4867, zip: '500001' },
    { name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lng: 80.2707, zip: '600001' },
    { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567, zip: '411001' },
    { name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lng: 72.5714, zip: '380001' },
    { name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lng: 88.3639, zip: '700001' },
    { name: 'Chandigarh', state: 'Chandigarh', country: 'India', lat: 30.7333, lng: 76.7794, zip: '160001' },
    { name: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lng: 75.7873, zip: '302001' },
    { name: 'Kochi', state: 'Kerala', country: 'India', lat: 9.9312, lng: 76.2673, zip: '682001' },
    { name: 'Goa', state: 'Goa', country: 'India', lat: 15.2993, lng: 74.1240, zip: '403001' },
    { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lng: 80.9462, zip: '226001' },
    { name: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7196, lng: 75.8577, zip: '452001' },
    { name: 'Surat', state: 'Gujarat', country: 'India', lat: 21.1702, lng: 72.8311, zip: '395001' },
];
const INTL_CITIES = [
    { name: 'Dubai', state: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, zip: '00000' },
    { name: 'Singapore', state: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, zip: '018956' },
    { name: 'London', state: 'England', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, zip: 'EC1A 1BB' },
    { name: 'New York', state: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, zip: '10001' },
    { name: 'San Francisco', state: 'California', country: 'United States', lat: 37.7749, lng: -122.4194, zip: '94102' },
    { name: 'Los Angeles', state: 'California', country: 'United States', lat: 34.0522, lng: -118.2437, zip: '90001' },
    { name: 'Tokyo', state: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, zip: '100-0001' },
    { name: 'Seoul', state: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, zip: '04524' },
    { name: 'Hong Kong', state: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694, zip: '999077' },
    { name: 'Bangkok', state: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, zip: '10110' },
    { name: 'Kuala Lumpur', state: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, zip: '50000' },
    { name: 'Sydney', state: 'New South Wales', country: 'Australia', lat: -33.8688, lng: 151.2093, zip: '2000' },
    { name: 'Paris', state: 'Île-de-France', country: 'France', lat: 48.8566, lng: 2.3522, zip: '75001' },
    { name: 'Berlin', state: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, zip: '10115' },
    { name: 'Toronto', state: 'Ontario', country: 'Canada', lat: 43.6532, lng: -79.3832, zip: 'M5V 2T6' },
];
const ALL_CITIES = [...INDIA_CITIES, ...INTL_CITIES];
/* ───────────────────────────────────────────────────────
   UNSPLASH IMAGE POOLS — CURATED, UNIQUE IMAGES PER CATEGORY
   ─────────────────────────────────────────────────────── */
const HOTEL_IMAGES = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c0d129fa?w=800&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
    'https://images.unsplash.com/photo-1549638441-b787d2e11f14?w=800&q=80',
    'https://images.unsplash.com/photo-1609766857326-18a204b18926?w=800&q=80',
    'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    'https://images.unsplash.com/photo-1585825736398-7caa2a24d36b?w=800&q=80',
    'https://images.unsplash.com/photo-1587874522487-fe10e954d035?w=800&q=80',
    'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=800&q=80',
    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80',
    'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ez637a5aa?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80',
    'https://images.unsplash.com/photo-1521783988139-89397d761dce?w=800&q=80',
    'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=800&q=80',
    'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&q=80',
    'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80',
    'https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800&q=80',
    'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=800&q=80',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80',
    'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800&q=80',
    'https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=800&q=80',
    'https://images.unsplash.com/photo-1580041065738-e72023775cdc?w=800&q=80',
    'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
    'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800&q=80',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80',
    'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80',
    'https://images.unsplash.com/photo-1570214476695-19bd467e3636?w=800&q=80',
    'https://images.unsplash.com/photo-1592229505726-ca121723b8ef?w=800&q=80',
    'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&q=80',
    'https://images.unsplash.com/photo-1504652517000-ae1068a02413?w=800&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    'https://images.unsplash.com/photo-1560200353-ce0a76b1d438?w=800&q=80',
    'https://images.unsplash.com/photo-1582610116397-edb318620f90?w=800&q=80',
    'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=800&q=80',
    'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=800&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1630660664869-c9d3cc676571?w=800&q=80',
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&q=80',
    'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80',
    'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=800&q=80',
    'https://images.unsplash.com/photo-1578991624414-276ef23a534f?w=800&q=80',
    'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
];
const COWORKING_IMAGES = [
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80',
    'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&q=80',
    'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80',
    'https://images.unsplash.com/photo-1600508774634-4e11e34078bb?w=800&q=80',
    'https://images.unsplash.com/photo-1595211877493-41a4e5f236b3?w=800&q=80',
    'https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=800&q=80',
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80',
    'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800&q=80',
    'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&q=80',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80',
    'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80',
    'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=80',
    'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800&q=80',
    'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80',
    'https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?w=800&q=80',
];
const POD_IMAGES = [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    'https://images.unsplash.com/photo-1605346576608-92f1346b67d6?w=800&q=80',
    'https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=800&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    'https://images.unsplash.com/photo-1556908153-1055164fe2df?w=800&q=80',
    'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&q=80',
    'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80',
    'https://images.unsplash.com/photo-1584132905271-512c958d674a?w=800&q=80',
    'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&q=80',
    'https://images.unsplash.com/photo-1588515724527-074a7a56616c?w=800&q=80',
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
    'https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=800&q=80',
    'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=800&q=80',
    'https://images.unsplash.com/photo-1587925358603-c2eea5305bbc?w=800&q=80',
];
const LOUNGE_IMAGES = [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80',
    'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80',
    'https://images.unsplash.com/photo-1504652517000-ae1068a02413?w=800&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
    'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800&q=80',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=800&q=80',
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
];
const MEETING_IMAGES = [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
    'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800&q=80',
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80',
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80',
    'https://images.unsplash.com/photo-1573167507387-6b4b98cb7c13?w=800&q=80',
    'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80',
    'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800&q=80',
    'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800&q=80',
];
const CAPSULE_IMAGES = [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    'https://images.unsplash.com/photo-1605346576608-92f1346b67d6?w=800&q=80',
    'https://images.unsplash.com/photo-1584132905271-512c958d674a?w=800&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
    'https://images.unsplash.com/photo-1556908153-1055164fe2df?w=800&q=80',
    'https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=800&q=80',
];
const TRANSIT_IMAGES = [
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c0d129fa?w=800&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80',
    'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=800&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80',
];
/* ───────────────────────────────────────────────────────
   AMENITY POOLS BY CATEGORY
   ─────────────────────────────────────────────────────── */
const HOTEL_AMENITIES = ['wifi', 'ac', 'tv', 'parking', 'room_service', 'minibar', 'safe', 'gym', 'pool', 'spa', 'restaurant', 'bar', 'laundry', 'shuttle', 'power_outlets', 'coffee_machine', 'shower'];
const COWORK_AMENITIES = ['wifi', 'ac', 'power_outlets', 'coffee_machine', 'printer', 'whiteboard', 'phone_booth', 'locker', 'quiet_zone', 'kitchen', 'projector', 'parking', 'conference_room', 'business_center'];
const POD_AMENITIES = ['wifi', 'ac', 'power_outlets', 'locker', 'quiet_zone', 'shower', 'safe', 'coffee_machine'];
const LOUNGE_AMENITIES = ['wifi', 'ac', 'shower', 'restaurant', 'bar', 'power_outlets', 'locker', 'quiet_zone', 'coffee_machine', 'tv', 'business_center'];
const MEET_AMENITIES = ['wifi', 'ac', 'projector', 'whiteboard', 'power_outlets', 'conference_room', 'coffee_machine', 'printer', 'phone_booth', 'parking'];
const CAPSULE_AMENITIES = ['wifi', 'ac', 'locker', 'shower', 'power_outlets', 'safe', 'quiet_zone', 'coffee_machine'];
const TRANSIT_AMENITIES = ['wifi', 'ac', 'shower', 'locker', 'safe', 'power_outlets', 'tv', 'room_service', 'coffee_machine', 'parking', 'shuttle'];
/* ───────────────────────────────────────────────────────
   STREET ADDRESS TEMPLATES
   ─────────────────────────────────────────────────────── */
const STREET_TEMPLATES = [
    '# MG Road', '# Brigade Road', '# Connaught Place', '# Bandra West', '# Park Street',
    '# Nariman Point', '# Sector 17', '# Jubilee Hills', '# Koramangala 5th Block',
    '# Anna Nagar', '# Hinjawadi IT Park', '# Airport Road', '# Station Road',
    '# Business Bay', '# Marina Boulevard', '# Oxford Street', '# 5th Avenue',
    '# Market Street', '# Sunset Boulevard', '# Shibuya', '# Gangnam-daero',
    '# Tsim Sha Tsui', '# Sukhumvit Road', '# Jalan Bukit Bintang', '# George Street',
    '# Champs-Élysées', '# Friedrichstraße', '# King Street West',
    '# Linking Road', '# FC Road', '# CG Road', '# Salt Lake City', '# MI Road',
];
const makeAddress = (city, idx) => {
    const template = STREET_TEMPLATES[idx % STREET_TEMPLATES.length];
    const num = 100 + (idx * 7) % 900;
    return template.replace('#', String(num));
};
// Helper to assign city indexes across India + International
const inCity = (i) => i % INDIA_CITIES.length;
const intlCity = (i) => INDIA_CITIES.length + (i % INTL_CITIES.length);
const HOTELS = [
    // India Hotels (35)
    { name: 'Grand Meridian Hotel', type: 'hotel', cityIdx: inCity(0), priceMin: 999, priceMax: 1999, desc: 'A 5-star luxury hotel offering impeccable service, panoramic city views, and world-class dining. Perfect for business travelers and discerning guests seeking hourly premium accommodation in the heart of the city.' },
    { name: 'Skyline Suites', type: 'hotel', cityIdx: inCity(1), priceMin: 1299, priceMax: 1999, desc: 'Modern high-rise suites with floor-to-ceiling windows, executive workstations, and a rooftop infinity pool. Ideal for short-term business stays with premium amenities and skyline views.' },
    { name: 'Royal Crest Hotel', type: 'hotel', cityIdx: inCity(2), priceMin: 899, priceMax: 1799, desc: 'Heritage-inspired luxury with contemporary comforts. Features ornate interiors, a tranquil spa, and gourmet restaurants. Book by the hour for a royal experience.' },
    { name: 'Urban Retreat', type: 'hotel', cityIdx: inCity(3), priceMin: 799, priceMax: 1499, desc: 'A boutique hotel designed for modern urban travelers. Minimalist design, smart room controls, high-speed WiFi, and a curated wellness center for your micro-stay.' },
    { name: 'Elite Residency', type: 'hotel', cityIdx: inCity(4), priceMin: 699, priceMax: 1399, desc: 'Upscale residency-style rooms with kitchenette, dedicated workspace, and premium linens. Tailored for extended hourly bookings and business professionals.' },
    { name: 'Harbor View Suites', type: 'hotel', cityIdx: inCity(0), priceMin: 1199, priceMax: 1999, desc: 'Waterfront luxury with stunning harbor views, private balconies, and an award-winning seafood restaurant. Your premium escape by the hour.' },
    { name: 'Sapphire Grand', type: 'hotel', cityIdx: inCity(5), priceMin: 899, priceMax: 1699, desc: 'Elegant rooms with sapphire-blue design accents, a rooftop bar, and a state-of-the-art fitness center. Where luxury meets flexibility.' },
    { name: 'The Metropolitan', type: 'hotel', cityIdx: inCity(6), priceMin: 799, priceMax: 1599, desc: 'A contemporary city-center hotel with sleek interiors, artisan coffee, and tech-forward room amenities. Perfect for the modern traveler on any schedule.' },
    { name: 'LuxeStay Business Hotel', type: 'hotel', cityIdx: inCity(7), priceMin: 699, priceMax: 1299, desc: 'Purpose-built for business travelers with soundproofed rooms, ergonomic workstations, high-speed fiber WiFi, and 24/7 concierge services.' },
    { name: 'Horizon Palace', type: 'hotel', cityIdx: inCity(8), priceMin: 999, priceMax: 1899, desc: 'A palatial hotel with landscaped gardens, marble lobbies, and grand suites. Hourly access to luxury that rivals the finest international hotels.' },
    { name: 'Aria Grand Hotel', type: 'hotel', cityIdx: inCity(9), priceMin: 849, priceMax: 1599, desc: 'Boutique luxury in the Pink City. Rajasthani architecture meets modern hospitality with rooftop dining, spa treatments, and curated heritage experiences.' },
    { name: 'Coastal Breeze Resort', type: 'hotel', cityIdx: inCity(10), priceMin: 799, priceMax: 1499, desc: 'Tropical waterfront resort with private beach access, Ayurvedic spa, and infinity pool overlooking the Arabian Sea. Micro-stays in paradise.' },
    { name: 'The Sunset Hotel', type: 'hotel', cityIdx: inCity(11), priceMin: 899, priceMax: 1699, desc: 'Beachside luxury in Goa with bohemian-chic design, sunset-facing suites, and farm-to-table dining. Your hourly getaway to the coast.' },
    { name: 'Heritage Grand Lucknow', type: 'hotel', cityIdx: inCity(12), priceMin: 699, priceMax: 1299, desc: 'Nawabi elegance with Mughal-inspired architecture, lush gardens, and a renowned kebab restaurant. Historical luxury available by the hour.' },
    { name: 'Regency Tower Hotel', type: 'hotel', cityIdx: inCity(13), priceMin: 649, priceMax: 1199, desc: 'A modern tower hotel with panoramic city views, executive lounge, and complimentary airport transfers. Smart luxury for smart travelers.' },
    { name: 'Diamond Bay Hotel', type: 'hotel', cityIdx: inCity(14), priceMin: 599, priceMax: 1099, desc: 'Surat\'s premier business hotel with diamond-district location, trade center access, and premium meeting facilities. Flexible hourly bookings welcome.' },
    { name: 'Taj Business Suites', type: 'hotel', cityIdx: inCity(0), priceMin: 1499, priceMax: 1999, desc: 'The gold standard in Indian hospitality. Butler service, bespoke amenities, and an address that speaks volumes. Premium hourly stays available.' },
    { name: 'Vivanta Premium', type: 'hotel', cityIdx: inCity(1), priceMin: 1199, priceMax: 1899, desc: 'Contemporary luxury with vibrant design, innovative dining concepts, and immersive wellness experiences. Micro-stays crafted for the urban explorer.' },
    { name: 'Park Plaza Executive', type: 'hotel', cityIdx: inCity(2), priceMin: 799, priceMax: 1399, desc: 'Centrally located executive hotel with business-ready rooms, complimentary breakfast, and a serene garden terrace. Hourly rates for maximum flexibility.' },
    { name: 'The Lalit Chandigarh', type: 'hotel', cityIdx: inCity(8), priceMin: 899, priceMax: 1599, desc: 'Art-deco inspired hotel with expansive suites, curated art collections, and farm-fresh dining. A design-forward hourly stay experience.' },
    { name: 'Radisson Blu Suite', type: 'hotel', cityIdx: inCity(3), priceMin: 999, priceMax: 1799, desc: 'International-standard luxury with spacious suites, Club Lounge access, and a rejuvenating spa. Book premium rooms by the hour.' },
    { name: 'ITC Royal Bengal', type: 'hotel', cityIdx: inCity(7), priceMin: 1199, priceMax: 1899, desc: 'Grand luxury inspired by Bengal\'s rich heritage. Features ITC\'s legendary cuisine, Kaya Kalp spa, and expansive suites. Hourly bookings now available.' },
    { name: 'Trident Towers', type: 'hotel', cityIdx: inCity(4), priceMin: 899, priceMax: 1599, desc: 'Oceanfront elegance with rooms overlooking Marine Drive. Features a legendary seafood restaurant and infinity pool. Premium micro-stays.' },
    { name: 'JW Marriott Premium', type: 'hotel', cityIdx: inCity(5), priceMin: 1099, priceMax: 1799, desc: 'The pinnacle of Marriott hospitality with exclusive club access, signature dining, and wellness center. Flexible hourly booking for premium guests.' },
    { name: 'Novotel City Center', type: 'hotel', cityIdx: inCity(6), priceMin: 699, priceMax: 1299, desc: 'Reliable international quality with modern rooms, all-day dining, and convenient city-center location. Affordable luxury by the hour.' },
    // International Hotels (25)
    { name: 'Burj Al Luxe Hotel', type: 'hotel', cityIdx: intlCity(0), priceMin: 1499, priceMax: 1999, desc: 'Ultra-luxury hotel in the heart of Dubai with gold-accented interiors, private butler service, and views of the Burj Khalifa. Hourly opulence redefined.' },
    { name: 'Marina Bay Grand', type: 'hotel', cityIdx: intlCity(1), priceMin: 1399, priceMax: 1999, desc: 'Singapore\'s crown jewel of hospitality with rooftop infinity pool, Michelin-starred dining, and panoramic skyline views. Premium hourly stays.' },
    { name: 'Westminster Palace Hotel', type: 'hotel', cityIdx: intlCity(2), priceMin: 1299, priceMax: 1999, desc: 'Classic British luxury near the Thames. Victorian architecture, afternoon tea service, and modern executive facilities. Quintessentially London.' },
    { name: 'Manhattan Skyline Hotel', type: 'hotel', cityIdx: intlCity(3), priceMin: 1399, priceMax: 1999, desc: 'Iconic Manhattan hotel with Times Square views, rooftop cocktail bar, and concierge services that define New York hospitality. Book by the hour.' },
    { name: 'Golden Gate Suites', type: 'hotel', cityIdx: intlCity(4), priceMin: 1199, priceMax: 1899, desc: 'Tech-forward boutique hotel in SoMa with smart rooms, artisan coffee bar, and spectacular Bay views. Silicon Valley meets hospitality.' },
    { name: 'Beverly Hills Residency', type: 'hotel', cityIdx: intlCity(5), priceMin: 1499, priceMax: 1999, desc: 'Hollywood glamour meets modern luxury. Private poolside cabanas, celebrity chef restaurant, and spa treatments by the hour.' },
    { name: 'Shibuya Crossing Hotel', type: 'hotel', cityIdx: intlCity(6), priceMin: 1099, priceMax: 1799, desc: 'Ultra-modern Japanese hospitality at the world\'s busiest intersection. Minimalist design, onsen spa, and robot concierge. Tokyo at its finest.' },
    { name: 'Gangnam Premium Suites', type: 'hotel', cityIdx: intlCity(7), priceMin: 999, priceMax: 1699, desc: 'K-style luxury in Seoul\'s trendiest district. Designer interiors, K-beauty spa, and rooftop garden. Hourly bookings for the discerning traveler.' },
    { name: 'Victoria Harbour Hotel', type: 'hotel', cityIdx: intlCity(8), priceMin: 1299, priceMax: 1999, desc: 'Panoramic harbour views, Cantonese fine dining, and jade-green spa. Hong Kong luxury redefined with flexible hourly stays.' },
    { name: 'Siam Orchid Palace', type: 'hotel', cityIdx: intlCity(9), priceMin: 799, priceMax: 1499, desc: 'Thai luxury on the Chao Phraya River with traditional teak interiors, floating breakfast, and award-winning Thai spa. Affordable hourly luxury.' },
    { name: 'Petronas View Hotel', type: 'hotel', cityIdx: intlCity(10), priceMin: 699, priceMax: 1399, desc: 'Five-star hotel with direct views of the Petronas Towers, infinity pool, and Malaysian fusion dining. Premium micro-stays in KL.' },
    { name: 'Darling Harbour Hotel', type: 'hotel', cityIdx: intlCity(11), priceMin: 1199, priceMax: 1899, desc: 'Waterfront luxury in Sydney with harbour bridge views, rooftop bar, and Australian contemporary cuisine. Book your harbour escape by the hour.' },
    { name: 'Champs-Élysées Grand', type: 'hotel', cityIdx: intlCity(12), priceMin: 1399, priceMax: 1999, desc: 'Parisian elegance on the world\'s most famous avenue. Art nouveau interiors, patisserie, and Eiffel Tower views. C\'est magnifique, by the hour.' },
    { name: 'Brandenburg Luxury Hotel', type: 'hotel', cityIdx: intlCity(13), priceMin: 999, priceMax: 1699, desc: 'Berlin\'s premier luxury hotel near the Brandenburg Gate. Industrial-chic design, craft beer garden, and cutting-edge wellness center.' },
    { name: 'Lakeshore Grand Toronto', type: 'hotel', cityIdx: intlCity(14), priceMin: 1099, priceMax: 1799, desc: 'Lakefront luxury with CN Tower views, farm-to-table Canadian cuisine, and Nordic-inspired spa. Toronto\'s finest hourly accommodation.' },
    { name: 'Palm Jumeirah Resort', type: 'hotel', cityIdx: intlCity(0), priceMin: 1599, priceMax: 1999, desc: 'Private beach villa on the iconic Palm with underwater aquarium, 7-star service, and helicopter transfers. The ultimate hourly luxury experience.' },
    { name: 'Raffles Heritage Hotel', type: 'hotel', cityIdx: intlCity(1), priceMin: 1499, priceMax: 1999, desc: 'Colonial grandeur at the legendary Raffles. Plantation fans, tropical gardens, and the original Singapore Sling. Heritage luxury by the hour.' },
    { name: 'Mayfair Court London', type: 'hotel', cityIdx: intlCity(2), priceMin: 1199, priceMax: 1899, desc: 'Discreet luxury in Mayfair with personal butler, Rolls-Royce transfer, and a private members\' club. Old-world charm, new-world convenience.' },
    { name: 'SoHo Boutique Hotel', type: 'hotel', cityIdx: intlCity(3), priceMin: 1099, priceMax: 1799, desc: 'Artsy boutique hotel in SoHo with gallery walls, craft cocktail bar, and rooms designed by emerging artists. NYC creativity meets comfort.' },
    { name: 'Nob Hill Heritage Inn', type: 'hotel', cityIdx: intlCity(4), priceMin: 999, priceMax: 1599, desc: 'Victorian mansion converted to boutique hotel with cable car views, wine cellar, and sourdough breakfast. San Francisco charm, hourly rates.' },
    { name: 'Harajuku Design Hotel', type: 'hotel', cityIdx: intlCity(6), priceMin: 899, priceMax: 1599, desc: 'Fashion-forward hotel in Tokyo\'s trendiest district. Kawaii-meets-minimalist rooms, matcha bar, and designer collaborations each season.' },
    { name: 'Itaewon Global Hotel', type: 'hotel', cityIdx: intlCity(7), priceMin: 849, priceMax: 1499, desc: 'Cosmopolitan hotel in Seoul\'s international district. Rooftop BBQ terrace, K-pop lounge, and multi-cultural dining options. Global soul, local heart.' },
    { name: 'Lan Kwai Fong Hotel', type: 'hotel', cityIdx: intlCity(8), priceMin: 1099, priceMax: 1799, desc: 'Vibrant boutique hotel in Hong Kong\'s nightlife capital. Sky terrace, dim sum breakfast, and bespoke cocktail experiences. Live the LKF life.' },
    { name: 'Khao San Road Hotel', type: 'hotel', cityIdx: intlCity(9), priceMin: 599, priceMax: 1199, desc: 'Boutique comfort on Bangkok\'s legendary backpacker strip. Rooftop pool, street food tours, and Thai boxing gym. Adventure starts at check-in.' },
    { name: 'Bukit Bintang Luxe', type: 'hotel', cityIdx: intlCity(10), priceMin: 749, priceMax: 1399, desc: 'Shopping district luxury with sky bridge to Pavilion KL, infinity pool, and Malaysian high tea. Retail therapy meets relaxation.' },
];
const COWORKING = [
    { name: 'Nexus Workspace', type: 'coworking', cityIdx: inCity(0), priceMin: 299, priceMax: 699, desc: 'Premium coworking space with hot desks, private cabins, and a vibrant startup community. High-speed fiber internet, unlimited coffee, and 24/7 access.' },
    { name: 'WorkHub Elite', type: 'coworking', cityIdx: inCity(1), priceMin: 399, priceMax: 699, desc: 'Executive coworking designed for professionals. Private phone booths, ergonomic furniture, and a members-only rooftop terrace with city views.' },
    { name: 'FlexDesk Pro', type: 'coworking', cityIdx: inCity(2), priceMin: 249, priceMax: 599, desc: 'Flexible desk solutions for solopreneurs and remote teams. Standing desks, pod seating, and a community kitchen with barista-grade coffee.' },
    { name: 'Urban Cowork', type: 'coworking', cityIdx: inCity(3), priceMin: 199, priceMax: 499, desc: 'Affordable yet stylish coworking with vibrant interiors, breakout areas, and regular networking events. Your second office in the city.' },
    { name: 'Connect Labs', type: 'coworking', cityIdx: inCity(4), priceMin: 349, priceMax: 649, desc: 'Innovation-focused workspace with maker lab, 3D printers, and startup incubation support. Where ideas become products.' },
    { name: 'Elevate Workspace', type: 'coworking', cityIdx: inCity(5), priceMin: 299, priceMax: 599, desc: 'High-floor coworking with panoramic views, meditation rooms, and wellness-focused design. Productivity meets wellbeing.' },
    { name: 'LaunchPad Cowork', type: 'coworking', cityIdx: inCity(6), priceMin: 199, priceMax: 449, desc: 'Startup-friendly workspace with investor pitch rooms, mentorship programs, and subsidized rates for early-stage ventures.' },
    { name: 'CloudDesk Premium', type: 'coworking', cityIdx: inCity(7), priceMin: 349, priceMax: 699, desc: 'Enterprise-grade coworking with dedicated floors, secure server rooms, and corporate concierge. Built for growing teams.' },
    { name: 'The Hive Workspace', type: 'coworking', cityIdx: inCity(8), priceMin: 249, priceMax: 549, desc: 'Buzzing creative coworking with open-plan design, art installations, and a curated events calendar. Community-driven productivity.' },
    { name: 'Innov8 Hub', type: 'coworking', cityIdx: inCity(9), priceMin: 299, priceMax: 599, desc: 'Design-forward workspace with biophilic design, nap pods, and a gaming lounge. Work hard, recharge harder.' },
    { name: 'Catalyst Workspace', type: 'coworking', cityIdx: inCity(10), priceMin: 249, priceMax: 499, desc: 'Waterfront coworking with tropical garden views, open-air meeting areas, and fresh coconut water on tap. Kerala\'s premium work destination.' },
    { name: 'BizNest Cowork', type: 'coworking', cityIdx: inCity(11), priceMin: 199, priceMax: 449, desc: 'Beach-adjacent coworking perfect for digital nomads. Surfboard storage, sunset terrace, and community dinners every Friday.' },
    { name: 'TechPark Office Hub', type: 'coworking', cityIdx: inCity(12), priceMin: 199, priceMax: 399, desc: 'Affordable workspace in the IT corridor with dedicated desks, meeting rooms, and a canteen serving local cuisine.' },
    // International
    { name: 'Emirates Business Hub', type: 'coworking', cityIdx: intlCity(0), priceMin: 499, priceMax: 699, desc: 'Gold-standard coworking in DIFC with private offices, concierge, and networking with MENA\'s top founders. Premium by the hour.' },
    { name: 'Marina One Workspace', type: 'coworking', cityIdx: intlCity(1), priceMin: 499, priceMax: 699, desc: 'Green-certified workspace in Singapore\'s CBD with lush vertical gardens, smart booking, and direct MRT access.' },
    { name: 'Shoreditch Creative Hub', type: 'coworking', cityIdx: intlCity(2), priceMin: 399, priceMax: 699, desc: 'East London creative coworking in a converted warehouse. Exposed brick, street art walls, and an in-house barista.' },
    { name: 'WeWork Hudson Yards', type: 'coworking', cityIdx: intlCity(3), priceMin: 499, priceMax: 699, desc: 'Premium coworking in NYC\'s newest neighborhood. Panoramic Hudson River views, curated events, and enterprise-grade infrastructure.' },
    { name: 'Mission District Studio', type: 'coworking', cityIdx: intlCity(4), priceMin: 449, priceMax: 699, desc: 'SF\'s favorite indie workspace with mural-covered walls, standing desks, and the best third-wave coffee in the Mission.' },
    { name: 'Roppongi Work Lounge', type: 'coworking', cityIdx: intlCity(6), priceMin: 399, priceMax: 699, desc: 'Japanese minimalist workspace with tatami meeting rooms, vending machine snacks, and blazing-fast internet. Shigotonin approved.' },
    { name: 'Gangnam Office Hub', type: 'coworking', cityIdx: intlCity(7), priceMin: 349, priceMax: 599, desc: 'K-style coworking with smart desks, soju bar after hours, and a rooftop garden. Seoul\'s most Instagrammable workspace.' },
    { name: 'Sukhumvit Work Club', type: 'coworking', cityIdx: intlCity(9), priceMin: 249, priceMax: 499, desc: 'Bangkok\'s premier coworking with pool access, Thai massage on demand, and tropical co-living packages. Digital nomad heaven.' },
    { name: 'KLCC Business Center', type: 'coworking', cityIdx: intlCity(10), priceMin: 299, priceMax: 549, desc: 'Twin towers views, halal pantry, and direct sky bridge access. KL\'s most connected coworking space for regional businesses.' },
    { name: 'Le Marais Workspace', type: 'coworking', cityIdx: intlCity(12), priceMin: 399, priceMax: 699, desc: 'Charming Parisian coworking in a 17th-century hôtel particulier. Croissant delivery, courtyard garden, and très chic interiors.' },
    { name: 'Kreuzberg Lab', type: 'coworking', cityIdx: intlCity(13), priceMin: 299, priceMax: 549, desc: 'Berlin\'s coolest workspace in a converted brewery. Club Mate fridge, DJ booth, and a thriving community of tech rebels.' },
    { name: 'Queen West Studio', type: 'coworking', cityIdx: intlCity(14), priceMin: 349, priceMax: 599, desc: 'Toronto\'s creative district workspace with podcast studios, green screen room, and a rooftop patio overlooking the skyline.' },
];
const REST_PODS = [
    { name: 'NapNest Pods', type: 'nap_pod', cityIdx: inCity(0), priceMin: 199, priceMax: 499, desc: 'Compact, high-tech sleep pods with noise cancellation, ambient lighting, and USB charging. Recharge in 30 minutes to 4 hours.' },
    { name: 'SnoozeHub', type: 'nap_pod', cityIdx: inCity(1), priceMin: 249, priceMax: 499, desc: 'Airport-adjacent rest pods with memory foam mattresses, blackout curtains, and complimentary eye masks. Power naps perfected.' },
    { name: 'RestBox Premium', type: 'nap_pod', cityIdx: inCity(2), priceMin: 149, priceMax: 399, desc: 'Ultra-private rest pods with biometric entry, climate control, and white noise generators. Your personal cocoon of calm.' },
    { name: 'QuickNap Lounge', type: 'nap_pod', cityIdx: inCity(3), priceMin: 199, priceMax: 449, desc: 'Luxury recliner pods with massage function, aromatherapy, and wake-up coffee service. Power napping, premium edition.' },
    { name: 'SleepStation Metro', type: 'nap_pod', cityIdx: inCity(4), priceMin: 149, priceMax: 349, desc: 'Metro-connected sleep pods available 24/7. Fresh linens, sanitized after every use, and bookable in 30-minute slots.' },
    { name: 'DreamPod Wellness', type: 'nap_pod', cityIdx: inCity(5), priceMin: 249, priceMax: 499, desc: 'Wellness-focused pods with guided meditation, circadian lighting, and post-nap smoothie bar. Sleep is self-care.' },
    { name: 'ZenRest Capsules', type: 'nap_pod', cityIdx: inCity(6), priceMin: 199, priceMax: 399, desc: 'Japanese-inspired zen pods with shoji screens, matcha station, and minimalist design. Find your calm in the city chaos.' },
    { name: 'PowerNap Hub', type: 'nap_pod', cityIdx: inCity(7), priceMin: 149, priceMax: 349, desc: 'Smart pods near major railway stations with app-controlled lighting, fresh air circulation, and instant booking via QR code.' },
    { name: 'CloudRest Pods', type: 'nap_pod', cityIdx: inCity(9), priceMin: 199, priceMax: 399, desc: 'Cloud-themed premium pods with suspension mattresses, rainfall sounds, and complimentary chai. Floating on air, literally.' },
    { name: 'SnoozeCube Express', type: 'nap_pod', cityIdx: inCity(11), priceMin: 149, priceMax: 299, desc: 'Beach-side rest cubes with ocean sounds, cooling mist, and tropical fruit refreshments. Recharge between adventures.' },
    // International
    { name: 'SkyNap Airport Pods', type: 'nap_pod', cityIdx: intlCity(0), priceMin: 399, priceMax: 499, desc: 'Premium airport nap pods in DXB Terminal 3. Noise-canceling cocoons, prayer room access, and halal snacks. Transit rest perfected.' },
    { name: 'Changi Sleep Lounge', type: 'nap_pod', cityIdx: intlCity(1), priceMin: 349, priceMax: 499, desc: 'Award-winning sleep pods at Changi Airport. Butterfly garden views, shower suites, and complimentary Singapore breakfast.' },
    { name: 'Heathrow RestPods', type: 'nap_pod', cityIdx: intlCity(2), priceMin: 399, priceMax: 499, desc: 'British-engineered sleep pods at Heathrow T5. Memory foam comfort, BBC radio wake-up, and English breakfast tea service.' },
    { name: 'JFK Transit Nap Zone', type: 'nap_pod', cityIdx: intlCity(3), priceMin: 349, priceMax: 499, desc: 'Modern rest pods in JFK International. NYC-themed ambient lighting, cold brew coffee, and USB-C fast charging in every pod.' },
    { name: 'Narita Dream Pods', type: 'nap_pod', cityIdx: intlCity(6), priceMin: 299, priceMax: 499, desc: 'Japanese precision meets rest technology. Automated pods with green tea service, heated floors, and konbini snack delivery.' },
    { name: 'Incheon Cloud Pods', type: 'nap_pod', cityIdx: intlCity(7), priceMin: 249, priceMax: 449, desc: 'K-beauty rest pods at Incheon Airport. Complimentary face masks, BTS ambient playlist, and Korean ginseng tea. Annyeong, sleep.' },
    { name: 'Suvarnabhumi Rest Zone', type: 'nap_pod', cityIdx: intlCity(9), priceMin: 199, priceMax: 399, desc: 'Thai-inspired rest pods with traditional Thai pillow, lemongrass aromatherapy, and mango sticky rice wake-up snack.' },
    { name: 'Kingsford Smith Pods', type: 'nap_pod', cityIdx: intlCity(11), priceMin: 349, priceMax: 499, desc: 'Aussie-style rest pods at Sydney Airport with flat white coffee, Tim Tam welcome pack, and ocean wave soundscapes.' },
    { name: 'CDG Repos Pods', type: 'nap_pod', cityIdx: intlCity(12), priceMin: 349, priceMax: 499, desc: 'Parisian rest pods at Charles de Gaulle with croissant delivery, lavender pillow mist, and Édith Piaf ambient sounds.' },
    { name: 'Pearson Rest Capsules', type: 'nap_pod', cityIdx: intlCity(14), priceMin: 299, priceMax: 449, desc: 'Canadian-comfort pods at Toronto Pearson. Maple-scented diffusers, poutine delivery, and NHL highlights on the pod screen.' },
];
const LOUNGES = [
    { name: 'SkyLounge Premium', type: 'lounge', cityIdx: inCity(0), priceMin: 699, priceMax: 1499, desc: 'First-class airport lounge with à la carte dining, premium bar, rain showers, and private workstations. The ultimate transit upgrade.' },
    { name: 'Executive Transit Lounge', type: 'lounge', cityIdx: inCity(1), priceMin: 599, priceMax: 1299, desc: 'Business-class lounge near IGI Airport with spa services, gourmet buffet, and day rooms for extended layovers.' },
    { name: 'Elite Airport Club', type: 'lounge', cityIdx: inCity(2), priceMin: 499, priceMax: 1199, desc: 'Members-only airport club with craft cocktails, live music evenings, and a curated library. Your pre-flight sanctuary.' },
    { name: 'Global Flyer Lounge', type: 'lounge', cityIdx: inCity(4), priceMin: 599, priceMax: 1299, desc: 'International lounge with multi-cuisine dining, dedicated kids area, and business center with video conferencing.' },
    { name: 'Crown Business Lounge', type: 'lounge', cityIdx: inCity(5), priceMin: 499, priceMax: 1099, desc: 'Premium city lounge with cigar room, whiskey library, and private meeting pods. Exclusive by invitation or hourly access.' },
    { name: 'Emerald Sky Lounge', type: 'lounge', cityIdx: inCity(7), priceMin: 599, priceMax: 1299, desc: 'Rooftop lounge overlooking the airport runway. Plane-spotting terrace, live kitchen, and premium bar selections.' },
    // International
    { name: 'Emirates First Lounge', type: 'lounge', cityIdx: intlCity(0), priceMin: 999, priceMax: 1499, desc: 'Gold-class lounge at DXB with Moët champagne, cigar lounge, spa with timeless treatments, and à la carte fine dining.' },
    { name: 'Silver Kris Lounge', type: 'lounge', cityIdx: intlCity(1), priceMin: 899, priceMax: 1499, desc: 'Singapore Airlines signature lounge with satay bar, reflexology service, and a peaceful garden atrium. Asia\'s best transit experience.' },
    { name: 'The Concorde Room', type: 'lounge', cityIdx: intlCity(2), priceMin: 999, priceMax: 1499, desc: 'Ultra-exclusive British Airways lounge at Heathrow. Cabanas, Elemis spa, and sommelier-selected wines. Supersonic luxury.' },
    { name: 'Centurion Lounge NYC', type: 'lounge', cityIdx: intlCity(3), priceMin: 899, priceMax: 1499, desc: 'Amex Centurion Lounge at JFK with celebrity chef menu, craft cocktails, and a spa suite. The gold standard of airport lounges.' },
    { name: 'Sakura Lounge Tokyo', type: 'lounge', cityIdx: intlCity(6), priceMin: 799, priceMax: 1299, desc: 'JAL\'s premium lounge with sushi chef, sake tasting, and traditional Japanese bath. Cherry blossom serenity before departure.' },
    { name: 'Orchid Lounge Bangkok', type: 'lounge', cityIdx: intlCity(9), priceMin: 599, priceMax: 1099, desc: 'Thai-inspired lounge with traditional massage, tom yum soup station, and a tropical fruit bar. Sabai sabai at the airport.' },
    { name: 'Golden Maple Lounge', type: 'lounge', cityIdx: intlCity(14), priceMin: 699, priceMax: 1299, desc: 'Air Canada\'s premium lounge with craft beer selection, poutine bar, and hockey highlights. Canadian hospitality at 30,000 feet.' },
    { name: 'Koru Lounge Sydney', type: 'lounge', cityIdx: intlCity(11), priceMin: 749, priceMax: 1299, desc: 'Air New Zealand lounge at Sydney with barista coffee, fresh seafood bar, and relaxation pods. Trans-Tasman comfort zone.' },
    { name: 'Salon Première Paris', type: 'lounge', cityIdx: intlCity(12), priceMin: 899, priceMax: 1499, desc: 'Air France\'s La Première lounge at CDG. Alain Ducasse dining, Clarins spa, and vintage Champagne. French luxury incarnate.' },
];
const MEETING_ROOMS = [
    { name: 'Boardroom One', type: 'meeting_room', cityIdx: inCity(0), priceMin: 499, priceMax: 999, desc: 'Executive boardroom with 4K displays, Zoom Rooms integration, and Italian leather seating for 12. Impress clients by the hour.' },
    { name: 'Executive Suite Meetings', type: 'meeting_room', cityIdx: inCity(1), priceMin: 599, priceMax: 999, desc: 'Corner-office meeting suite with panoramic views, Bose surround sound, and dedicated tech support. Board meetings elevated.' },
    { name: 'Nexus Conference Space', type: 'meeting_room', cityIdx: inCity(2), priceMin: 399, priceMax: 799, desc: 'Modular conference space that scales from 4 to 40 people. Wireless presentation, recording studio, and catering options.' },
    { name: 'Skyline Boardroom', type: 'meeting_room', cityIdx: inCity(3), priceMin: 449, priceMax: 899, desc: 'Glass-walled boardroom on the 30th floor with dual projection, video conferencing, and a dedicated reception desk.' },
    { name: 'Summit Meeting Center', type: 'meeting_room', cityIdx: inCity(5), priceMin: 349, priceMax: 749, desc: 'Full-service meeting center with breakout rooms, event catering, and AV technician support. From workshops to town halls.' },
    { name: 'Pinnacle Conference Room', type: 'meeting_room', cityIdx: inCity(7), priceMin: 399, priceMax: 799, desc: 'Heritage building boardroom with mahogany table, oil paintings, and modern AV. Where tradition meets technology.' },
    { name: 'Innovation Lab Meeting', type: 'meeting_room', cityIdx: inCity(9), priceMin: 299, priceMax: 599, desc: 'Creative meeting space with writable walls, brainstorming tools, and standing-height tables. Designed for design thinking.' },
    // International
    { name: 'DIFC Boardroom', type: 'meeting_room', cityIdx: intlCity(0), priceMin: 699, priceMax: 999, desc: 'Premium boardroom in Dubai International Financial Centre. Arabic coffee service, calligraphy-themed decor, and 8K display.' },
    { name: 'Canary Wharf Suite', type: 'meeting_room', cityIdx: intlCity(2), priceMin: 599, priceMax: 999, desc: 'Corporate meeting suite in London\'s financial district. Thames views, British tea service, and state-of-the-art conferencing.' },
    { name: 'Midtown Executive Room', type: 'meeting_room', cityIdx: intlCity(3), priceMin: 699, priceMax: 999, desc: 'Power-meeting room in Midtown Manhattan. Empire State views, on-call notary, and Bloomberg terminal access. Deals get done here.' },
    { name: 'Marunouchi Board Suite', type: 'meeting_room', cityIdx: intlCity(6), priceMin: 599, priceMax: 999, desc: 'Japanese corporate meeting room with shoji screens, green tea ceremony service, and simultaneous translation booths.' },
    { name: 'Orchard Road Conference', type: 'meeting_room', cityIdx: intlCity(1), priceMin: 499, priceMax: 899, desc: 'Singapore CBD meeting room with tropical garden backdrop, smart glass walls, and Tiger beer for post-meeting celebrations.' },
    { name: 'CBD Meeting Hub Sydney', type: 'meeting_room', cityIdx: intlCity(11), priceMin: 499, priceMax: 899, desc: 'Modern meeting room in Sydney CBD with harbour glimpses, flat white delivery, and native Australian timber interiors.' },
    { name: 'Friedrichstraße Board', type: 'meeting_room', cityIdx: intlCity(13), priceMin: 399, priceMax: 799, desc: 'Berlin meeting room in a historic building. Bauhaus-inspired design, Club Mate on tap, and excellent transit connections.' },
    { name: 'Bay Street Boardroom', type: 'meeting_room', cityIdx: intlCity(14), priceMin: 499, priceMax: 899, desc: 'Toronto\'s financial district premium boardroom. Maple wood interiors, Tim Hortons catering, and lakefront views.' },
];
const CAPSULES = [
    { name: 'CapsuleX Mumbai', type: 'capsule_hotel', cityIdx: inCity(0), priceMin: 299, priceMax: 599, desc: 'Japanese-style capsule hotel with personal entertainment system, USB ports, and memory foam pod. Airport proximity for transit travelers.' },
    { name: 'PodStay Delhi', type: 'capsule_hotel', cityIdx: inCity(1), priceMin: 249, priceMax: 549, desc: 'Tech-forward capsule stay with biometric entry, climate control, and communal lounge. Budget luxury for smart travelers.' },
    { name: 'Urban Capsules Bangalore', type: 'capsule_hotel', cityIdx: inCity(2), priceMin: 199, priceMax: 499, desc: 'IT-corridor capsule hotel with coding-friendly lighting, high-speed WiFi, and a gaming lounge. Designed for tech professionals.' },
    { name: 'SleepCube Chennai', type: 'capsule_hotel', cityIdx: inCity(4), priceMin: 249, priceMax: 499, desc: 'Modern capsule hotel near Chennai Central with sanitized pods, 24/7 security, and a fresh filter coffee bar.' },
    { name: 'MicroStay Pods Pune', type: 'capsule_hotel', cityIdx: inCity(5), priceMin: 199, priceMax: 449, desc: 'Compact capsule hotel perfect for Pune\'s IT professionals. Pod-to-pod privacy, shared kitchen, and rooftop yoga deck.' },
    // International
    { name: 'Shinjuku Capsule Inn', type: 'capsule_hotel', cityIdx: intlCity(6), priceMin: 399, priceMax: 599, desc: 'Authentic Japanese capsule hotel in Shinjuku. Onsen bath, vending machine restaurant, and the original capsule experience.' },
    { name: 'Hongdae Pod Hotel', type: 'capsule_hotel', cityIdx: intlCity(7), priceMin: 299, priceMax: 549, desc: 'K-pop themed capsule hotel in Hongdae. LED mood lighting, karaoke pod upgrade, and Korean snack vending machines.' },
    { name: 'Mong Kok Micro Hotel', type: 'capsule_hotel', cityIdx: intlCity(8), priceMin: 349, priceMax: 599, desc: 'Compact luxury in Mong Kok with harbor views from premium pods, dim sum breakfast, and night market walking tours.' },
    { name: 'Silom Capsule Bangkok', type: 'capsule_hotel', cityIdx: intlCity(9), priceMin: 199, priceMax: 399, desc: 'Budget-luxury capsules on Silom Road. Rooftop pool, pad thai delivery, and Thai massage bookable from your pod screen.' },
    { name: 'Circular Quay Pods', type: 'capsule_hotel', cityIdx: intlCity(11), priceMin: 399, priceMax: 599, desc: 'Waterfront capsule hotel near the Sydney Opera House. Acoustic pods, surf report wake-up, and Vegemite toast breakfast.' },
];
const TRANSIT = [
    { name: 'Transit Haven Mumbai', type: 'transit_room', cityIdx: inCity(0), priceMin: 499, priceMax: 999, desc: 'Airport-adjacent transit rooms with fresh linens, hot shower, and complimentary meals. Your comfort zone between flights.' },
    { name: 'QuickStay Express Delhi', type: 'transit_room', cityIdx: inCity(1), priceMin: 599, priceMax: 999, desc: 'IGI Airport transit hotel with 4-hour minimum stay, room service, and complimentary airport shuttle every 15 minutes.' },
    { name: 'Layover Hub Bangalore', type: 'transit_room', cityIdx: inCity(2), priceMin: 449, priceMax: 899, desc: 'KIA-connected transit rooms with soundproofing, workspace, and a la carte Indian breakfast. Productive layovers guaranteed.' },
    { name: 'CityStop Suites Chennai', type: 'transit_room', cityIdx: inCity(4), priceMin: 399, priceMax: 799, desc: 'Central station transit suites with porter service, luggage storage, and quick-service South Indian meals.' },
    { name: 'RailRest Chandigarh', type: 'transit_room', cityIdx: inCity(8), priceMin: 449, priceMax: 799, desc: 'Railway station transit rooms with premium bedding, hot water, and Punjabi breakfast. Rest between trains in comfort.' },
    // International
    { name: 'DXB Transit Hotel', type: 'transit_room', cityIdx: intlCity(0), priceMin: 799, priceMax: 999, desc: 'In-terminal transit hotel at Dubai Airport. Spa suite upgrade, Arabic meze dining, and duty-free shopping concierge.' },
    { name: 'Changi Transit Haven', type: 'transit_room', cityIdx: intlCity(1), priceMin: 699, priceMax: 999, desc: 'Jewel-adjacent transit rooms with butterfly garden access, free city tour, and Singaporean hawker food delivered to room.' },
    { name: 'Heathrow Transit Rooms', type: 'transit_room', cityIdx: intlCity(2), priceMin: 799, priceMax: 999, desc: 'Airside transit hotel at Heathrow T5. British luxury amenities, afternoon tea, and BA lounge access included.' },
    { name: 'JFK Aero Hotel', type: 'transit_room', cityIdx: intlCity(3), priceMin: 699, priceMax: 999, desc: 'Modern transit hotel at JFK T4. New York deli breakfast, runway views, and complimentary AirTrain pass.' },
    { name: 'Haneda Rest House', type: 'transit_room', cityIdx: intlCity(6), priceMin: 599, priceMax: 999, desc: 'Traditional Japanese transit accommodation at Haneda. Futon bedding, green tea service, and Tsukiji-fresh sushi breakfast.' },
];
const ALL_LISTINGS = [
    ...HOTELS,
    ...COWORKING,
    ...REST_PODS,
    ...LOUNGES,
    ...MEETING_ROOMS,
    ...CAPSULES,
    ...TRANSIT,
];
/* ───────────────────────────────────────────────────────
   IMAGE SELECTOR — unique per listing
   ─────────────────────────────────────────────────────── */
const IMAGE_POOLS = {
    hotel: HOTEL_IMAGES,
    coworking: COWORKING_IMAGES,
    nap_pod: POD_IMAGES,
    lounge: LOUNGE_IMAGES,
    meeting_room: MEETING_IMAGES,
    capsule_hotel: CAPSULE_IMAGES,
    transit_room: TRANSIT_IMAGES,
};
const imageCounters = {};
const getImages = (type, count) => {
    const pool = IMAGE_POOLS[type] || HOTEL_IMAGES;
    if (!imageCounters[type])
        imageCounters[type] = 0;
    const images = [];
    for (let i = 0; i < count; i++) {
        images.push(pool[imageCounters[type] % pool.length]);
        imageCounters[type]++;
    }
    return images;
};
/* ───────────────────────────────────────────────────────
   AMENITY SELECTOR
   ─────────────────────────────────────────────────────── */
const AMENITY_POOLS = {
    hotel: HOTEL_AMENITIES,
    coworking: COWORK_AMENITIES,
    nap_pod: POD_AMENITIES,
    lounge: LOUNGE_AMENITIES,
    meeting_room: MEET_AMENITIES,
    capsule_hotel: CAPSULE_AMENITIES,
    transit_room: TRANSIT_AMENITIES,
};
const getAmenities = (type) => {
    const pool = AMENITY_POOLS[type] || HOTEL_AMENITIES;
    return pickN(pool, 4 + Math.floor(Math.random() * 4));
};
/* ───────────────────────────────────────────────────────
   ROOM TYPE MAPPING BY PROPERTY TYPE
   ─────────────────────────────────────────────────────── */
const ROOM_TYPES_BY_PROP = {
    hotel: [
        { type: 'standard', label: 'Standard Room', capacity: 2, sizeSqft: 280 },
        { type: 'deluxe', label: 'Deluxe Room', capacity: 2, sizeSqft: 380 },
        { type: 'suite', label: 'Executive Suite', capacity: 3, sizeSqft: 550 },
    ],
    coworking: [
        { type: 'desk', label: 'Hot Desk', capacity: 1, sizeSqft: 40 },
        { type: 'private_office', label: 'Private Office', capacity: 4, sizeSqft: 200 },
        { type: 'meeting_room', label: 'Meeting Room', capacity: 8, sizeSqft: 300 },
    ],
    nap_pod: [
        { type: 'pod', label: 'Standard Pod', capacity: 1, sizeSqft: 35 },
        { type: 'pod', label: 'Premium Pod', capacity: 1, sizeSqft: 50 },
    ],
    lounge: [
        { type: 'lounge_seat', label: 'Lounge Seat', capacity: 1, sizeSqft: 30 },
        { type: 'lounge_seat', label: 'Premium Suite', capacity: 2, sizeSqft: 120 },
    ],
    meeting_room: [
        { type: 'meeting_room', label: 'Small Meeting Room', capacity: 6, sizeSqft: 200 },
        { type: 'meeting_room', label: 'Large Boardroom', capacity: 16, sizeSqft: 500 },
    ],
    capsule_hotel: [
        { type: 'capsule', label: 'Standard Capsule', capacity: 1, sizeSqft: 30 },
        { type: 'capsule', label: 'Premium Capsule', capacity: 1, sizeSqft: 45 },
    ],
    transit_room: [
        { type: 'standard', label: 'Transit Single', capacity: 1, sizeSqft: 180 },
        { type: 'deluxe', label: 'Transit Double', capacity: 2, sizeSqft: 250 },
    ],
};
/* ───────────────────────────────────────────────────────
   MAIN SEED FUNCTION
   ─────────────────────────────────────────────────────── */
const seed = async () => {
    await (0, database_1.default)();
    logger_1.logger.info('🌱 Starting RESTIGO production seed (155 listings)...');
    // Clear existing data
    await Promise.all([
        auth_model_1.User.deleteMany({}),
        property_model_1.Property.deleteMany({}),
        room_model_1.Room.deleteMany({}),
        inventory_slot_model_1.InventorySlot.deleteMany({}),
    ]);
    logger_1.logger.info('  ✓ Cleared existing data');
    // ── Create Users ──
    const admin = await auth_model_1.User.create({
        email: 'admin@restigo.app', password: 'Admin@123456',
        firstName: 'Admin', lastName: 'Restigo', role: 'admin',
        isEmailVerified: true,
    });
    const providers = [];
    for (let i = 1; i <= 10; i++) {
        const provider = await auth_model_1.User.create({
            email: `provider${i}@restigo.app`, password: 'Provider@123',
            firstName: `Provider`, lastName: `${i}`, role: 'provider',
            isEmailVerified: true,
        });
        providers.push(provider);
    }
    await auth_model_1.User.create({
        email: 'user@restigo.app', password: 'User@123456',
        firstName: 'Test', lastName: 'User', role: 'user',
        isEmailVerified: true,
    });
    logger_1.logger.info('  ✓ Created 12 users (1 admin, 10 providers, 1 test user)');
    // ── Create Properties ──
    const properties = [];
    let created = 0;
    for (let i = 0; i < ALL_LISTINGS.length; i++) {
        const listing = ALL_LISTINGS[i];
        const city = ALL_CITIES[listing.cityIdx];
        const provider = providers[i % providers.length];
        // Add slight randomness to coordinates so listings don't stack
        const lngOffset = (Math.random() - 0.5) * 0.08;
        const latOffset = (Math.random() - 0.5) * 0.08;
        const images = getImages(listing.type, 3);
        const amenities = getAmenities(listing.type);
        const is24h = ['capsule_hotel', 'hotel', 'transit_room', 'nap_pod'].includes(listing.type);
        const isFeatured = i < 25 || Math.random() > 0.7; // first 25 + random others
        try {
            const property = await property_model_1.Property.create({
                providerId: provider._id,
                name: listing.name,
                description: listing.desc,
                type: listing.type,
                images,
                location: {
                    type: 'Point',
                    coordinates: [city.lng + lngOffset, city.lat + latOffset],
                    address: makeAddress(city, i),
                    city: city.name,
                    state: city.state,
                    country: city.country,
                    zipCode: city.zip,
                },
                amenities,
                contact: {
                    phone: `+91${9000000000 + i}`,
                    email: `info@${listing.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                },
                priceRange: {
                    min: listing.priceMin,
                    max: listing.priceMax,
                    currency: city.country === 'India' ? 'INR' : 'USD',
                },
                rating: {
                    average: randRating(3.8, 5.0),
                    count: randBetween(15, 500),
                },
                status: 'active',
                isVerified: true,
                featured: isFeatured,
                operatingHours: {
                    open: is24h ? '00:00' : '06:00',
                    close: is24h ? '23:59' : '22:00',
                    is24Hours: is24h,
                    closedDays: [],
                },
                policies: {
                    cancellationPolicy: pick(['flexible', 'moderate', 'strict']),
                    minBookingHours: 1,
                    maxBookingHours: listing.type === 'nap_pod' ? 6 : listing.type === 'meeting_room' ? 8 : 24,
                },
            });
            properties.push(property);
            created++;
        }
        catch (err) {
            // Slug collision — append random suffix and retry
            try {
                const property = await property_model_1.Property.create({
                    providerId: provider._id,
                    name: listing.name + ` ${city.name}`,
                    description: listing.desc,
                    type: listing.type,
                    images: getImages(listing.type, 3),
                    location: {
                        type: 'Point',
                        coordinates: [city.lng + lngOffset + 0.01, city.lat + latOffset + 0.01],
                        address: makeAddress(city, i + 100),
                        city: city.name,
                        state: city.state,
                        country: city.country,
                        zipCode: city.zip,
                    },
                    amenities,
                    contact: {
                        phone: `+91${9000000000 + i}`,
                        email: `info@${listing.name.toLowerCase().replace(/[^a-z0-9]/g, '')}${i}.com`,
                    },
                    priceRange: {
                        min: listing.priceMin,
                        max: listing.priceMax,
                        currency: city.country === 'India' ? 'INR' : 'USD',
                    },
                    rating: {
                        average: randRating(3.8, 5.0),
                        count: randBetween(15, 500),
                    },
                    status: 'active',
                    isVerified: true,
                    featured: isFeatured,
                    operatingHours: {
                        open: is24h ? '00:00' : '06:00',
                        close: is24h ? '23:59' : '22:00',
                        is24Hours: is24h,
                        closedDays: [],
                    },
                    policies: {
                        cancellationPolicy: pick(['flexible', 'moderate', 'strict']),
                        minBookingHours: 1,
                        maxBookingHours: listing.type === 'nap_pod' ? 6 : listing.type === 'meeting_room' ? 8 : 24,
                    },
                });
                properties.push(property);
                created++;
            }
            catch (err2) {
                logger_1.logger.warn(`  ⚠ Skipped duplicate: ${listing.name} — ${err2.message}`);
            }
        }
    }
    logger_1.logger.info(`  ✓ Created ${created} properties`);
    // ── Create Rooms + Inventory Slots ──
    let totalRooms = 0;
    let totalSlots = 0;
    const slotsToInsert = [];
    for (const property of properties) {
        const roomDefs = ROOM_TYPES_BY_PROP[property.type] || ROOM_TYPES_BY_PROP.hotel;
        const roomCount = roomDefs.length + Math.floor(Math.random() * 2); // base + 0-1 extra
        for (let r = 0; r < roomCount; r++) {
            const def = roomDefs[r % roomDefs.length];
            const priceVariance = 0.8 + Math.random() * 0.4; // 80%-120% of property base
            const basePrice = Math.round(property.priceRange.min * priceVariance);
            try {
                const room = await room_model_1.Room.create({
                    propertyId: property._id,
                    name: `${def.label} ${r + 1}`,
                    type: def.type,
                    roomNumber: `${Math.floor(Math.random() * 9) + 1}${String(r + 1).padStart(2, '0')}${Math.floor(Math.random() * 1000)}`, // more unique to avoid collision
                    capacity: { adults: def.capacity, children: 0 },
                    basePrice,
                    currency: property.priceRange.currency || 'INR',
                    amenities: pickN(property.amenities, 3),
                    size: { value: def.sizeSqft, unit: 'sqft' },
                    description: `${def.label} with modern amenities and premium comfort.`,
                });
                totalRooms++;
                // Generate 3 days of inventory slots
                const today = new Date();
                for (let d = 0; d < 3; d++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() + d);
                    date.setHours(0, 0, 0, 0);
                    const startHour = property.operatingHours.is24Hours ? 0 : 6;
                    const endHour = property.operatingHours.is24Hours ? 24 : 22;
                    for (let hour = startHour; hour < endHour; hour++) {
                        slotsToInsert.push({
                            roomId: room._id,
                            propertyId: property._id,
                            date,
                            startTime: `${hour.toString().padStart(2, '0')}:00`,
                            endTime: `${((hour + 1) % 24).toString().padStart(2, '0')}:00`,
                            durationMinutes: 60,
                            status: Math.random() > 0.15 ? 'available' : 'booked', // 85% available
                            basePrice: room.basePrice,
                            currency: room.currency,
                        });
                    }
                }
            }
            catch (err) {
                // Skip duplicate room numbers
            }
        }
        await property_model_1.Property.findByIdAndUpdate(property._id, { totalRooms: roomCount });
    }
    // Batch insert slots in chunks to avoid document limits
    const chunkSize = 2000;
    for (let i = 0; i < slotsToInsert.length; i += chunkSize) {
        const chunk = slotsToInsert.slice(i, i + chunkSize);
        try {
            await inventory_slot_model_1.InventorySlot.insertMany(chunk, { ordered: false });
            totalSlots += chunk.length;
            logger_1.logger.info(`  ✓ Inserted batch of ${chunk.length} inventory slots`);
        }
        catch (err) {
            if (err.insertedDocs) {
                totalSlots += err.insertedDocs.length;
            }
        }
    }
    logger_1.logger.info(`  ✓ Created ${totalRooms} rooms`);
    logger_1.logger.info(`  ✓ Created ${totalSlots} inventory slots`);
    // ── Summary ──
    const stats = {
        users: await auth_model_1.User.countDocuments(),
        properties: await property_model_1.Property.countDocuments(),
        rooms: await room_model_1.Room.countDocuments(),
        slots: await inventory_slot_model_1.InventorySlot.countDocuments(),
    };
    logger_1.logger.info('');
    logger_1.logger.info('═══════════════════════════════════════════');
    logger_1.logger.info('  ✅ RESTIGO Database Seeded Successfully');
    logger_1.logger.info('═══════════════════════════════════════════');
    logger_1.logger.info(`  Users:       ${stats.users}`);
    logger_1.logger.info(`  Properties:  ${stats.properties}`);
    logger_1.logger.info(`  Rooms:       ${stats.rooms}`);
    logger_1.logger.info(`  Slots:       ${stats.slots}`);
    logger_1.logger.info('');
    logger_1.logger.info('  Login credentials:');
    logger_1.logger.info('    Admin:     admin@restigo.app / Admin@123456');
    logger_1.logger.info('    Provider:  provider1@restigo.app / Provider@123');
    logger_1.logger.info('    User:      user@restigo.app / User@123456');
    logger_1.logger.info('═══════════════════════════════════════════');
    process.exit(0);
};
seed().catch((err) => {
    logger_1.logger.error('Seed error:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map
import axios from "axios";

const BASE_URL = process.env.NIMBUS_BASE_URL!;
const EMAIL = process.env.NIMBUS_EMAIL!;
const PASSWORD = process.env.NIMBUS_PASSWORD!;
const IS_MOCK = process.env.NIMBUS_MOCK === "true";

const PICKUP_WAREHOUSE = process.env.NIMBUS_PICKUP_WAREHOUSE!;
const PICKUP_NAME = process.env.NIMBUS_PICKUP_NAME!;
const PICKUP_PHONE = process.env.NIMBUS_PICKUP_PHONE!;
const PICKUP_ADDRESS = process.env.NIMBUS_PICKUP_ADDRESS!;
const PICKUP_ADDRESS2 = process.env.NIMBUS_PICKUP_ADDRESS2 || "";
const PICKUP_CITY = process.env.NIMBUS_PICKUP_CITY!;
const PICKUP_STATE = process.env.NIMBUS_PICKUP_STATE!;
const PICKUP_PINCODE = process.env.NIMBUS_PICKUP_PINCODE!;

class NimbusService {

    private token: string | null = null;

    private async login() {

        if (IS_MOCK) {
            return "MOCK_TOKEN";
        }

        if (this.token) {
            return this.token;
        }

        const { data } = await axios.post(
            `${BASE_URL}/users/login`,
            {
                email: EMAIL,
                password: PASSWORD
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!data.status) {
            throw new Error(data.message || "Nimbus login failed.");
        }

        this.token = data.data.token;

        return this.token;

    }

    private async getHeaders() {

        const token = await this.login();

        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };

    }

    // ===========================
    // Shipping Rates
    // ===========================

    async getShippingRates(payload: {
        destination: string;
        payment_type: "cod" | "prepaid";
        order_amount?: number;
        weight: number;
        length: number;
        breadth: number;
        height: number;
    }) {

        if (IS_MOCK) {

            return {

                status: true,

                lowestCourier: {

                    id: "1",
                    name: "DTDC Air",
                    freight_charges: 61.36,
                    cod_charges: 40.12,
                    total_charges: 96.48

                },

                couriers: [

                    {
                        id: "1",
                        name: "DTDC Air",
                        freight_charges: 61.36,
                        cod_charges: 40.12,
                        total_charges: 96.48
                    },

                    {
                        id: "2",
                        name: "Delhivery Air",
                        freight_charges: 75.52,
                        cod_charges: 42.48,
                        total_charges: 118
                    }

                ]

            };

        }

        const requestBody = {

            origin: process.env.NIMBUS_PICKUP_PINCODE,

            destination: payload.destination,

            payment_type: payload.payment_type,

            order_amount: payload.order_amount,

            weight: payload.weight,

            length: payload.length,

            breadth: payload.breadth,

            height: payload.height

        };

        const { data } = await axios.post(

            `${BASE_URL}/courier/serviceability`,

            requestBody,

            {

                headers: await this.getHeaders()

            }

        );

        if (!data.status) {

            throw new Error(

                data.message ||

                "Unable to fetch shipping rates."

            );

        }

        const couriers = [...data.data].sort(

            (a: any, b: any) =>

                Number(a.total_charges) -

                Number(b.total_charges)

        );

        return {

            status: true,

            lowestCourier: couriers[0],

            couriers

        };

    }

    

    // ===========================
    // Create Shipment
    // ===========================

    async createShipment(payload: any) {

        const rates = await this.getShippingRates({

            destination: payload.consignee.pincode,

            payment_type: payload.payment_type,

            order_amount: payload.order_amount,

            weight: payload.package_weight,

            length: payload.package_length,

            breadth: payload.package_breadth,

            height: payload.package_height

        });

        const lowestCourier = rates.lowestCourier;

        payload.courier_id = Number(lowestCourier.id);

        payload.shipping_charges = Number(
            lowestCourier.total_charges
        );

        payload.request_auto_pickup = "yes";

        payload.is_insurance = 0;

        payload.pickup = {

            warehouse_name: PICKUP_WAREHOUSE,

            name: PICKUP_NAME,

            address: PICKUP_ADDRESS,

            address_2: PICKUP_ADDRESS2,

            city: PICKUP_CITY,

            state: PICKUP_STATE,

            pincode: PICKUP_PINCODE,

            phone: PICKUP_PHONE

        };

        if (IS_MOCK) {

            return {

                status: true,

                shipping_charge: Number(
                    lowestCourier.total_charges
                ),

                data: {

                    order_id: 100001,

                    shipment_id: 500001,

                    awb_number: "MOCK123456789",

                    courier_id: Number(lowestCourier.id),

                    courier_name: lowestCourier.name,

                    status: "booked",

                    label: "https://example.com/label.pdf"

                }

            };

        }

        const { data } = await axios.post(

            `${BASE_URL}/shipments`,

            payload,

            {

                headers: await this.getHeaders()

            }

        );

        if (!data.status) {

            throw new Error(

                data.message ||

                "Shipment creation failed."

            );

        }

        data.shipping_charge = Number(
            lowestCourier.total_charges
        );

        return data;

    }

    // ===========================
// Track Shipment
// ===========================

async trackShipment(awbNumber: string) {

    if (IS_MOCK) {

        return {

            status: true,

            data: {

                awb_number: awbNumber,

                current_status: "IT",

                current_status_name: "In Transit",

                tracking_history: [

                    {
                        status: "PP",
                        status_name: "Pending Pickup"
                    },

                    {
                        status: "IT",
                        status_name: "In Transit"
                    }

                ]

            }

        };

    }

    const { data } = await axios.get(

        `${BASE_URL}/shipments/track/${awbNumber}`,

        {

            headers: await this.getHeaders()

        }

    );

    if (!data.status) {

        throw new Error(

            data.message ||

            "Unable to fetch tracking."

        );

    }

    return data;

}

}

export default new NimbusService();
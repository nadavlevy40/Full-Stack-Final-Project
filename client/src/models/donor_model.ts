import { Schema, model, Document } from "mongoose";

export interface IDonor extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    address: string;
}

const DonorSchema = new Schema<IDonor>({
    firstName: { 
        type: String,
         required: true
     },
    lastName: {
         type: String,
          required: true 
    },
    email: {
         type: String,
          required: true,
           unique: true
     },
    password: { 
        type: String,
         required: true 
    },
    phoneNumber: {
         type: String,
          required: true
     },
    address: {
         type: String,
          required: true 
    },
});

const DonorModel = model<IDonor>("Donor", DonorSchema);

export default DonorModel;

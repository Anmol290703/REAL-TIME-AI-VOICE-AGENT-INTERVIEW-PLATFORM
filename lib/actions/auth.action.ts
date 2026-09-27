'use server';

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function signUp(params: SignUpParams){
    const { uid, name, email } = params;

    try {
        const userRecord = await db.collection('users').doc(uid).get();

        if(userRecord.exists) {
            return {
                success: false,
                message: "User already exists. Please sign-in instead."
            }
        }

        await db.collection('users').doc(uid).set({
            name, email
        })

        return {
            success: true,
            message: "Account created successfully. Please sign in."
        }
    } catch(e: unknown) {
        console.error("Error creating a user", e);

        if(typeof e === "object" && e && "code" in e && e.code === "auth/email-already-exists"){
            return {
                success: false,
                message: "This eamil is already in use."
            }
        }

        return {
            success: false,
            message: "Failed to create an account."
        }
    }
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        const userRecord = await auth.getUserByEmail(email);

        if(!userRecord) {
            return {
                success: false,
                message: "User does not exist. Create an account instead."
            }
        }

        const userDoc = db.collection('users').doc(userRecord.uid);
        const userSnapshot = await userDoc.get();

        if(!userSnapshot.exists) {
            await userDoc.set({
                name: userRecord.displayName || email.split("@")[0],
                email,
            })
        }

        await setSessionCookie(idToken);

        return {
            success: true,
            message: "Signed in successfully."
        }
    } catch(e) {
        console.log(e);

        return {
            success: false,
            message: "Failed to log into the account."
        }
    }
}

export async function setSessionCookie(idToken: string){
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK * 1000,
    })

    cookieStore.set('session', sessionCookie, {
        maxAge: ONE_WEEK,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
    })
}

export async function getCurrentUser(): Promise<User | null>{
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('session')?.value;

    if(!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        const userRecord = await db.collection('users').doc(decodedClaims.uid).get();

        if(!userRecord.exists) return null;

        return {
            ...userRecord.data(),
            id: userRecord.id,
        } as User;
    } catch(e){
        console.log(e);

        return null;
    }
}

export async function isAuthenticated(){
    const user = await getCurrentUser();

    return !!user;
}

export async function signOut(){
    const cookieStore = await cookies();

    cookieStore.delete('session');
    redirect("/sign-in");
}

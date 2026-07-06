import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function isValidSession(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    try {
        await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
        return true;
    } catch {
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("session")?.value;
    const valid = await isValidSession(token);

    const isLoginPage = pathname === "/login";
    const isLoginApi = pathname === "/api/auth/login";

    if (!valid && !isLoginPage && !isLoginApi) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (valid && isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon.svg|.*\\.png$).*)"],
};

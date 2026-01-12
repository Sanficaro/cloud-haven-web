import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'lib', 'personalities.json');

export async function GET() {
    try {
        if (!fs.existsSync(STORAGE_PATH)) {
            return NextResponse.json({ error: 'Storage not found' }, { status: 404 });
        }
        const data = fs.readFileSync(STORAGE_PATH, 'utf8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const newData = await req.json();
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(newData, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}

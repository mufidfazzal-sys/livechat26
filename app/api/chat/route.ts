import { NextRequest, NextResponse } from 'next/server';
import { getMessages, saveMessage, deleteMessage, clearAllMessages } from '../../../lib/chatStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, message, isAdmin, avatar } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const saved = await saveMessage(name || 'Anonim', message, !!isAdmin, avatar);
    return NextResponse.json({ success: true, message: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const clearAll = url.searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await clearAllMessages();
      return NextResponse.json({ success: true, message: 'Semua pesan berhasil dihapus' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pesan diperlukan' }, { status: 400 });
    }

    const deleted = await deleteMessage(id);
    if (deleted) {
      return NextResponse.json({ success: true, message: 'Pesan berhasil dihapus' });
    } else {
      return NextResponse.json({ success: false, error: 'Pesan tidak ditemukan' }, { status: 444 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

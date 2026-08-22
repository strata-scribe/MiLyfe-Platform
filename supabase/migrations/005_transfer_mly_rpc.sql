-- Server-side validated $MLY transfer
-- Prevents overdrawing, validates recipient exists, and does atomic balance updates
CREATE OR REPLACE FUNCTION transfer_mly(
  sender_id UUID,
  recipient_identifier TEXT,
  transfer_amount NUMERIC,
  transfer_note TEXT DEFAULT ''
) RETURNS VOID AS $$
DECLARE
  sender_balance NUMERIC;
  recipient_id UUID;
  recipient_name TEXT;
BEGIN
  -- Validate amount
  IF transfer_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than 0';
  END IF;

  -- Lock sender row and check balance
  SELECT mly_balance INTO sender_balance
  FROM profiles
  WHERE id = sender_id
  FOR UPDATE;

  IF sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender not found';
  END IF;

  IF sender_balance < transfer_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', sender_balance, transfer_amount;
  END IF;

  -- Find recipient by display_name or id
  SELECT id, display_name INTO recipient_id, recipient_name
  FROM profiles
  WHERE display_name ILIKE recipient_identifier
     OR id::TEXT = recipient_identifier
  LIMIT 1;

  IF recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient not found: %', recipient_identifier;
  END IF;

  IF recipient_id = sender_id THEN
    RAISE EXCEPTION 'Cannot send $MLY to yourself';
  END IF;

  -- Deduct from sender
  UPDATE profiles
  SET mly_balance = mly_balance - transfer_amount
  WHERE id = sender_id;

  -- Credit to recipient
  UPDATE profiles
  SET mly_balance = mly_balance + transfer_amount
  WHERE id = recipient_id;

  -- Record sender transaction
  INSERT INTO transactions (user_id, type, amount, description, category, to_user)
  VALUES (sender_id, 'sent', transfer_amount, transfer_note, 'transfer', recipient_id::TEXT);

  -- Record recipient transaction
  INSERT INTO transactions (user_id, type, amount, description, category, from_user)
  VALUES (recipient_id, 'received', transfer_amount, 'Received from community member', 'transfer', sender_id::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

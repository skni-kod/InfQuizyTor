-- Create the table to store USOS OAuth access tokens associated with users
CREATE TABLE IF NOT EXISTS user_tokens (
    -- User's unique ID obtained from USOS API after authentication
    -- Adjust VARCHAR size if needed based on the actual format of USOS IDs
    user_usos_id VARCHAR(50) PRIMARY KEY,

    -- OAuth 1.0a Access Token
    access_token TEXT NOT NULL,

    -- OAuth 1.0a Access Token Secret
    access_token_secret TEXT NOT NULL,

    -- Array to store the scopes granted by the user (optional but useful)
    scopes TEXT[] NULL,

    -- Timestamps for tracking when the token was created and last updated
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: Create or replace a trigger function to automatically update the 'updated_at' timestamp
-- This ensures 'updated_at' reflects the time of the last modification to a row.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the 'updated_at' column of the NEW row being inserted or updated to the current time
  NEW.updated_at = NOW();
  -- Return the modified NEW row to be inserted/updated
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists (to avoid errors on re-running the script)
DROP TRIGGER IF EXISTS set_timestamp ON user_tokens;

-- Create the trigger that calls the function before any UPDATE operation on the 'user_tokens' table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON user_tokens
FOR EACH ROW -- The trigger function will execute for each row affected by the UPDATE
EXECUTE PROCEDURE trigger_set_timestamp(); -- Call the timestamp update function

-- Add comments to columns for clarity (optional)
COMMENT ON COLUMN user_tokens.user_usos_id IS 'Unique User ID from USOS API';
COMMENT ON COLUMN user_tokens.access_token IS 'OAuth 1.0a Access Token';
COMMENT ON COLUMN user_tokens.access_token_secret IS 'OAuth 1.0a Access Token Secret';
COMMENT ON COLUMN user_tokens.scopes IS 'Array of OAuth scopes granted by the user';
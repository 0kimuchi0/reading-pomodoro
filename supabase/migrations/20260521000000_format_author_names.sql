-- 著者名フォーマット変換: "Last, First" → "Last・First", 複数著者は "Last1・First1, Last2・First2"
CREATE OR REPLACE FUNCTION format_author_name(name text) RETURNS text AS $$
DECLARE
  parts text[];
  result text[];
  i int;
BEGIN
  parts := string_to_array(name, ', ');

  IF array_length(parts, 1) <= 1 THEN
    RETURN replace(replace(name, ' ', '・'), '　', '・');
  END IF;

  i := 1;
  WHILE i <= array_length(parts, 1) LOOP
    IF i + 1 <= array_length(parts, 1) THEN
      result := array_append(result, trim(parts[i]) || '・' || trim(parts[i+1]));
      i := i + 2;
    ELSE
      result := array_append(result, trim(parts[i]));
      i := i + 1;
    END IF;
  END LOOP;

  RETURN array_to_string(result, ', ');
END;
$$ LANGUAGE plpgsql;

UPDATE books
SET author = format_author_name(author)
WHERE author LIKE '%, %' OR author LIKE '% %';

UPDATE suggest_books
SET author = format_author_name(author)
WHERE author LIKE '%, %' OR author LIKE '% %';

DROP FUNCTION format_author_name;

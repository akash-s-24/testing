CREATE POLICY "Anyone can update posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Anyone can update comments" ON comments FOR UPDATE USING (true);

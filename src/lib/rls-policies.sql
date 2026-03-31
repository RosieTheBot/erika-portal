-- RLS Policies for Homebase Portal
-- Ensures data access control at database level

-- Properties Table
CREATE POLICY "admins_all_properties" ON properties
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "sellers_own_properties" ON properties
  FOR SELECT USING (seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "buyers_assigned_properties" ON properties
  FOR SELECT USING (buyer_id = auth.uid());

-- Property Engagement (Like/Trash/Comments)
CREATE POLICY "users_own_engagement" ON property_engagement
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "users_view_property_engagement" ON property_engagement
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE seller_id = auth.uid() OR buyer_id = auth.uid()
    )
  );

-- Tasks Table
CREATE POLICY "admins_all_tasks" ON tasks
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "sellers_own_tasks" ON tasks
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "buyers_own_tasks" ON tasks
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE buyer_id = auth.uid()
    )
  );

-- Documents Table
CREATE POLICY "admins_all_documents" ON documents
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "sellers_own_documents" ON documents
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "buyers_view_documents" ON documents
  FOR SELECT USING (
    visibility = 'public' AND property_id IN (
      SELECT id FROM properties WHERE buyer_id = auth.uid()
    )
  );

-- Notifications Table
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Property Photos (Public Read)
CREATE POLICY "anyone_view_photos" ON property_photos
  FOR SELECT USING (true);

-- STR Data (Public Read for assigned properties)
CREATE POLICY "assigned_view_str_data" ON str_data
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE seller_id = auth.uid() OR buyer_id = auth.uid()
    )
  );

-- Task Templates (Public Read)
CREATE POLICY "anyone_view_templates" ON task_templates
  FOR SELECT USING (true);

alter table rotation_annotations drop constraint rotation_annotations_bone_check;

alter table rotation_annotations add constraint rotation_annotations_bone_check
  check (bone in ('thighL', 'thighR', 'upperArmL', 'upperArmR', 'forearmL', 'forearmR', 'upperBack'));

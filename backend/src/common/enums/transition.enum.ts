export enum TransitionType {
  TRANSFER_CLASS = 'transfer_class',    // chuyển lớp
  TRANSFER_BRANCH = 'transfer_branch',  // chuyển đổi (chi đoàn/nhánh)
  PROMOTE = 'promote',                  // lên lớp
  SET_INACTIVE = 'set_inactive',        // nghỉ học
  SET_ON_LEAVE = 'set_on_leave',        // tạm nghỉ
  SET_RESERVED = 'set_reserved',        // bảo lưu
  REACTIVATE = 'reactivate',            // kích hoạt lại
}


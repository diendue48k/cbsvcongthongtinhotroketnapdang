import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export interface FieldConfig {
  label?: string;
  placeholder?: string;
  required?: boolean;
  hidden?: boolean;
}

export interface CustomField {
  id: string;
  section: string;
  label: string;
  type: 'text' | 'textarea' | 'date';
  required: boolean;
  placeholder: string;
}

export interface Activity {
  id: string;
  name: string;
  organizer: string;
  time: string;
  details: string;
}

export interface FormConfig {
  fields: Record<string, FieldConfig>;
  customFields: CustomField[];
  templates: Record<string, string>;
  lists: Record<string, string[]>;
  activities: Activity[];
}

export const DEFAULT_CONFIG: FormConfig = {
  fields: {},
  customFields: [],
  templates: {
    selfAssessment: '- Phẩm chất đạo đức, lối sống: Luôn có ý thức tự giác trong học tập và rèn luyện; chấp hành tốt các nội quy, quy định của nhà trường và pháp luật của Nhà nước; có lối sống lành mạnh, giản dị, gần gũi với mọi người.\n- Năng lực công tác: Có tinh thần trách nhiệm cao trong công việc được giao; có khả năng làm việc nhóm tốt; tích cực tham gia các hoạt động phong trào của Đoàn, Hội.\n- Quan hệ quần chúng: Luôn đoàn kết, giúp đỡ bạn bè; có mối quan hệ tốt với thầy cô và mọi người xung quanh.\n- Khuyết điểm: Đôi khi còn chưa sắp xếp thời gian khoa học; kỹ năng thuyết trình trước đám đông còn hạn chế.\n- Phương hướng phấn đấu: Tiếp tục học tập trau dồi kiến thức chuyên môn; rèn luyện bản lĩnh chính trị vững vàng; phấn đấu sớm được đứng vào hàng ngũ của Đảng Cộng sản Việt Nam.',
    personalHistory: 'Từ tháng 09/2012 đến tháng 05/2017: Học tại trường Tiểu học ...\nTừ tháng 09/2017 đến tháng 05/2021: Học tại trường THCS ...\nTừ tháng 09/2021 đến tháng 05/2024: Học tại trường THPT ...\nTừ tháng 09/2024 đến nay: Sinh viên lớp ..., Khoa ..., trường Đại học Kinh tế - ĐHĐN',
    familyHistory_ongNoi: 'Họ và tên: LÊ VĨNH A\nNăm sinh: 1949\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: đội 3, thôn Đức Xá, xã Vĩnh Thủy, tỉnh Quảng Trị.\nNghề nghiệp: Nông dân\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\n\nQuá trình công tác, sinh sống:\n1949 – 1954: còn nhỏ ở với gia đình ở địa phương tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1954 – 1964: Đi học văn hóa ở trường làng tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1964 – 1975: ở với bố mẹ làm nông và tham gia dân quân ở địa phương phục vụ kháng chiến chống mỹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 - 1979: Làm nông và sinh sống tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1979 – 1982: Đi bộ đội tại xã Đồng Đăng, tỉnh Lạng Sơn.\n1982 – nay: Làm nông và sinh sống tại đội 3, thôn Đức Xá, xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nKhen thưởng: Được chủ tịch nước Trần Đức Lương tặng thưởng: Huy chương kháng chiến chống mỹ hạng nhất.\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_baNoi: 'Họ và tên: PHAN THỊ B\nNăm sinh: 1953\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: Đội 3, thôn Đức Xá, xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị\nNghề nghiệp: Nông dân\n\nQuá trình công tác, sinh sống:\n1953 – 1959: còn nhỏ ở với gia đình ở địa phương tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1959 – 1967: Đi học cấp 1 ở trường làng tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1967 – 1970: đi K8 sơ tán ra tỉnh Thái Bình.\n1970 – 1975: Trở về địa phương, sau đó tham gia dân quân ở địa phương phục vụ kháng chiến chống Mỹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 - nay: làm nông và sinh sống tại đội 3, thôn Đức Xá, xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị.\n\nKhen thưởng: Được chủ tịch nước Trần Đức Lương tặng thưởng: Huy chương kháng chiến chống mỹ hạng nhất.\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_ongNgoai: 'Họ và tên: NGUYỄN VĂN F\nNăm sinh: 1935\nNăm mất: 2021\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\n\nQuá trình công tác, sinh sống:\n1935 – 1941: còn nhỏ ở với gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1941 - 1945: học cấp 1 tại trường làng ở Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1945 - 1948: học cấp 2 tại trường làng ở Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1948 – 1957: Tham gia vào ban thường vụ nông hội Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1957 – 1958: Hội đồng nhân dân kế toán Hợp tác xã sơ cấp tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1958 – 1962: Tham gia vào ban Thường vụ Đoàn Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1962 – 1975: Phó bí thư Đoàn Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 - 1985: Bí thư chi bộ, trưởng ban kiểm soát hợp tác xã tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1985 – 1990: Chủ tịch Ủy ban Mặt trận Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1990 – 2021: Nghỉ hưu ở nhà tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2021: Mất do lâm bệnh nặng, tại Xã Vĩnh Thủy, tỉnh Quảng Trị.',
    familyHistory_baNgoai: 'Họ và tên: NGUYỄN THỊ H\nNăm sinh: 1935\nNăm mất: 2007\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: xã Vĩnh Linh, tỉnh Quảng Trị. ( Trước đây là xã Vĩnh Chấp, huyện Vĩnh Linh, tỉnh Quảng Trị.)\nNơi sinh: xã Vĩnh Chấp, huyện Vĩnh Linh, tỉnh Quảng Trị (Nay là xã Vĩnh Linh, tỉnh Quảng Trị)\n\nQuá trình công tác, sinh sống:\n1935 – 1941: Còn nhỏ ở với gia đình ở địa phương tại xã Vĩnh Linh, tỉnh Quảng Trị.\n1941 - 1952: học chữ tại trường làng ở xã Vĩnh Linh, tỉnh Quảng Trị.\n1952 - 1975: Tham gia lao động sản xuất và tham gia lực lượng dân quân du kích của xã Vĩnh Linh, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 – 2007: Ở nhà làm nông tại xã Vĩnh Thủy, huyện Vĩnh Thủy, huyện Vĩnh Linh, Quảng Trị.\nNăm 2007: Mất do lâm bệnh nặng, tại Xã Vĩnh Thủy, tỉnh Quảng Trị.',
    familyHistory_chaRuot: 'Họ và tên: LÊ VĨNH M\nNăm sinh: 1977\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nCCCD: 0492123456789\nNghề nghiệp: Nông dân\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\nThông tin Đảng viên: kết nạp Đảng ngày 18/9/2000 tại Chi bộ thôn Đức Xá, Đảng bộ xã Vĩnh Thủy, tỉnh Quảng Trị. Hiện đang sinh hoạt Đảng tại Chi bộ thôn Đức Xá, Đảng bộ xã Vĩnh Thủy, tỉnh Quảng Trị. Hồ sơ Đảng lưu tại Ban xây dựng Đảng, Đảng ủy xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nQuá trình công tác, sinh sống:\n1977 – 1986: sống với cha mẹ tại xã Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1986 - 1991: Đi học cấp 1 ở trường làng tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1991 - 1997: phụ giúp gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1997 – 1999: Đi bộ đội phòng không ở phường Hòa Minh, quận Liên Chiểu, thành phố Đà Nẵng(Nay là Phường Hòa Khánh, Thành phố Đà Nẵng)\n1999: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\nNăm 1999 – nay: Sinh sống và làm nông tại Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_meRuot: 'Họ và tên: NGUYỄN THỊ F\nNăm sinh: 1976\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nCCCD: 0492123456789\nNghề nghiệp: Nông dân\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nQuá trình công tác, sinh sống:\n1976 – 1982: Sống với cha mẹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1982 - 1987: đi học cấp 1 tại trường làng ở Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1987 - 1999: phụ giúp gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1999: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\nNăm 1999 – nay: Sinh sống và làm nông tại Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_emRuot: 'Họ và tên: LÊ VĂN V\nNăm sinh: 2004\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nCCCD: 0492123456789\nNghề nghiệp: Sinh viên\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: 15X Ngũ Hành Sơn, Tổ 61, phường Mỹ An, quận Sơn Trà, thành phố Đà Nẵng\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\nThông tin Đảng viên: kết nạp Đảng ngày 26/7/2023 tại Chi bộ Sinh viên thuộc Đảng bộ Trường Đại học Kinh tế - Đại học Đà Nẵng. Hiện đang sinh hoạt Đảng tại Chi bộ Sinh viên thuộc Đảng bộ Trường Đại học Kinh tế. Hồ sơ Đảng lưu tại Đảng ủy ủy ban nhân dân thành phố Đà Nẵng.\n\nQuá trình công tác, sinh sống:\n2004 – 2010: Còn nhỏ sống với cha mẹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2010 – 2015: Học tại trường tiểu học Vĩnh Thủy, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2015 – 2019: Học tại Trường trung học cơ sở Chu Văn An, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2019 – 2022: Học tại trường Trung học cơ sở và trung học phổ thông Bến Hải, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2022 – nay: Học Đại học tại trường Đại học công nghệ thông tin và truyền thông Việt Hàn, phường Ngũ Hành Sơn, thành phố Đà Nẵng.\n\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_voChong: 'Họ và tên: NGUYỄN THỊ C\nNăm sinh: 2000\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nCCCD: 0492123456789\nNghề nghiệp: Nhân viên văn phòng\nQuê quán: Phường Hải Châu 1, quận Hải Châu, thành phố Đà Nẵng\nNơi sinh: Phường Hải Châu 1, quận Hải Châu, thành phố Đà Nẵng\nChỗ ở hiện nay: 15X Ngũ Hành Sơn, Tổ 61, phường Mỹ An, quận Sơn Trà, thành phố Đà Nẵng\n\nQuá trình công tác, sinh sống:\n2000 – 2018: Sống và học tập tại phường Hải Châu 1, quận Hải Châu, thành phố Đà Nẵng.\n2018 – 2022: Học Đại học tại trường Đại học Kinh tế - Đại học Đà Nẵng.\n2022 – nay: Làm việc tại Công ty TNHH ABC, thành phố Đà Nẵng.\n\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_conCai: 'Họ và tên: LÊ NGUYỄN D\nNăm sinh: 2023\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: Phường Hải Châu 1, quận Hải Châu, thành phố Đà Nẵng\nNơi sinh: Phường Hải Châu 1, quận Hải Châu, thành phố Đà Nẵng\nChỗ ở hiện nay: 15X Ngũ Hành Sơn, Tổ 61, phường Mỹ An, quận Sơn Trà, thành phố Đà Nẵng\n\nQuá trình công tác, sinh sống:\n2023 – nay: Còn nhỏ, sống cùng cha mẹ tại phường Mỹ An, quận Sơn Trà, thành phố Đà Nẵng.',
    familyHistory_boVoChong: 'Họ và tên: LÊ VĨNH M\nNăm sinh: 1977\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nCCCD: 0492123456789\nNghề nghiệp: Nông dân\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\nThông tin Đảng viên: kết nạp Đảng ngày 18/9/2000 tại Chi bộ thôn Đức Xá, Đảng bộ xã Vĩnh Thủy, tỉnh Quảng Trị. Hiện đang sinh hoạt Đảng tại Chi bộ thôn Đức Xá, Đảng bộ xã Vĩnh Thủy, tỉnh Quảng Trị. Hồ sơ Đảng lưu tại Ban xây dựng Đảng, Đảng ủy xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nQuá trình công tác, sinh sống:\n1977 – 1986: sống với cha mẹ tại xã Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1986 - 1991: Đi học cấp 1 ở trường làng tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1991 - 1997: phụ giúp gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1997 – 1999: Đi bộ đội phòng không ở phường Hòa Minh, quận Liên Chiểu, thành phố Đà Nẵng(Nay là Phường Hòa Khánh, Thành phố Đà Nẵng)\n1999: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\nNăm 1999 – nay: Sinh sống và làm nông tại Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_meVoChong: 'Họ và tên: NGUYỄN THỊ F\nNăm sinh: 1976\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nCCCD: 0492123456789\nNghề nghiệp: Nông dân\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nQuá trình công tác, sinh sống:\n1976 – 1982: Sống với cha mẹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1982 - 1987: đi học cấp 1 tại trường làng ở Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1987 - 1999: phụ giúp gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1999: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\nNăm 1999 – nay: Sinh sống và làm nông tại Đội 2, thôn Đức Xá, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_ongNoiVoChong: 'Họ và tên: LÊ VĨNH A\nNăm sinh: 1949\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: đội 3, thôn Đức Xá, xã Vĩnh Thủy, tỉnh Quảng Trị.\nNghề nghiệp: Nông dân\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\n\nQuá trình công tác, sinh sống:\n1949 – 1954: còn nhỏ ở với gia đình ở địa phương tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1954 – 1964: Đi học văn hóa ở trường làng tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1964 – 1975: ở với bố mẹ làm nông và tham gia dân quân ở địa phương phục vụ kháng chiến chống mỹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 - 1979: Làm nông và sinh sống tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1979 – 1982: Đi bộ đội tại xã Đồng Đăng, tỉnh Lạng Sơn.\n1982 – nay: Làm nông và sinh sống tại đội 3, thôn Đức Xá, xã Vĩnh Thủy, tỉnh Quảng Trị.\n\nKhen thưởng: Được chủ tịch nước Trần Đức Lương tặng thưởng: Huy chương kháng chiến chống mỹ hạng nhất.\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_baNoiVoChong: 'Họ và tên: PHAN THỊ B\nNăm sinh: 1953\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: Đội 3, thôn Đức Xá, xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị\nNghề nghiệp: Nông dân\n\nQuá trình công tác, sinh sống:\n1953 – 1959: còn nhỏ ở với gia đình ở địa phương tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1959 – 1967: Đi học cấp 1 ở trường làng tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1967 – 1970: đi K8 sơ tán ra tỉnh Thái Bình.\n1970 – 1975: Trở về địa phương, sau đó tham gia dân quân ở địa phương phục vụ kháng chiến chống Mỹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 - nay: làm nông và sinh sống tại đội 3, thôn Đức Xá, xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị.\n\nKhen thưởng: Được chủ tịch nước Trần Đức Lương tặng thưởng: Huy chương kháng chiến chống mỹ hạng nhất.\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    familyHistory_ongNgoaiVoChong: 'Họ và tên: NGUYỄN VĂN F\nNăm sinh: 1935\nNăm mất: 2021\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\n\nQuá trình công tác, sinh sống:\n1935 – 1941: còn nhỏ ở với gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1941 - 1945: học cấp 1 tại trường làng ở Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1945 - 1948: học cấp 2 tại trường làng ở Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1948 – 1957: Tham gia vào ban thường vụ nông hội Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1957 – 1958: Hội đồng nhân dân kế toán Hợp tác xã sơ cấp tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1958 – 1962: Tham gia vào ban Thường vụ Đoàn Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1962 – 1975: Phó bí thư Đoàn Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 - 1985: Bí thư chi bộ, trưởng ban kiểm soát hợp tác xã tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1985 – 1990: Chủ tịch Ủy ban Mặt trận Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1990 – 2021: Nghỉ hưu ở nhà tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2021: Mất do lâm bệnh nặng, tại Xã Vĩnh Thủy, tỉnh Quảng Trị.',
    familyHistory_baNgoaiVoChong: 'Họ và tên: NGUYỄN THỊ H\nNăm sinh: 1935\nNăm mất: 2007\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nQuê quán: xã Vĩnh Linh, tỉnh Quảng Trị. ( Trước đây là xã Vĩnh Chấp, huyện Vĩnh Linh, tỉnh Quảng Trị.)\nNơi sinh: xã Vĩnh Chấp, huyện Vĩnh Linh, tỉnh Quảng Trị (Nay là xã Vĩnh Linh, tỉnh Quảng Trị)\n\nQuá trình công tác, sinh sống:\n1935 – 1941: Còn nhỏ ở với gia đình ở địa phương tại xã Vĩnh Linh, tỉnh Quảng Trị.\n1941 - 1952: học chữ tại trường làng ở xã Vĩnh Linh, tỉnh Quảng Trị.\n1952 - 1975: Tham gia lao động sản xuất và tham gia lực lượng dân quân du kích của xã Vĩnh Linh, tỉnh Quảng Trị.\n1975: Lập gia đình tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n1975 – 2007: Ở nhà làm nông tại xã Vĩnh Thủy, huyện Vĩnh Thủy, huyện Vĩnh Linh, Quảng Trị.\nNăm 2007: Mất do lâm bệnh nặng, tại Xã Vĩnh Thủy, tỉnh Quảng Trị.',
    familyHistory_anhChiEmVoChong: 'Họ và tên: LÊ VĂN V\nNăm sinh: 2004\nTôn giáo: Không\nDân tộc: Kinh\nQuốc tịch: Việt Nam\nCCCD: 0492123456789\nNghề nghiệp: Sinh viên\nQuê quán: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nNơi sinh: Xã Vĩnh Thủy, tỉnh Quảng Trị. (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị).\nChỗ ở hiện nay: 15X Ngũ Hành Sơn, Tổ 61, phường Mỹ An, quận Sơn Trà, thành phố Đà Nẵng\nĐảng viên: Là Đảng viên Đảng Cộng sản Việt Nam\nThông tin Đảng viên: kết nạp Đảng ngày 26/7/2023 tại Chi bộ Sinh viên thuộc Đảng bộ Trường Đại học Kinh tế - Đại học Đà Nẵng. Hiện đang sinh hoạt Đảng tại Chi bộ Sinh viên thuộc Đảng bộ Trường Đại học Kinh tế. Hồ sơ Đảng lưu tại Đảng ủy ủy ban nhân dân thành phố Đà Nẵng.\n\nQuá trình công tác, sinh sống:\n2004 – 2010: Còn nhỏ sống với cha mẹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2010 – 2015: Học tại trường tiểu học Vĩnh Thủy, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2015 – 2019: Học tại Trường trung học cơ sở Chu Văn An, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2019 – 2022: Học tại trường Trung học cơ sở và trung học phổ thông Bến Hải, Xã Vĩnh Thủy, tỉnh Quảng Trị.\n2022 – nay: Học Đại học tại trường Đại học công nghệ thông tin và truyền thông Việt Hàn, phường Ngũ Hành Sơn, thành phố Đà Nẵng.\n\nThái độ chính trị: Luôn chấp hành tốt mọi chủ trương, đường lối, chính sách của Đảng và pháp luật của Nhà nước.',
    otherInfo: '- Khen thưởng: Đạt danh hiệu Sinh viên 5 tốt cấp Trường năm học 2024-2025; Giải Nhì cuộc thi ...\n- Kỷ luật: Không\n- Đặc điểm lịch sử: Từ nhỏ đến nay luôn chấp hành tốt các chủ trương, đường lối chính sách của Đảng và pháp luật của Nhà nước; không vi phạm pháp luật; không tham gia các tổ chức phản động; lịch sử chính trị gia đình trong sạch.'
  },
  lists: {
    faculties: [
      'Kế toán',
      'Ngân hàng',
      'Luật',
      'Tài chính',
      'Kinh tế',
      'Quản trị kinh doanh',
      'Kinh doanh quốc tế',
      'Du lịch',
      'Lý luận chính trị',
      'Thống kê - Tin học',
      'Thương mại điện tử',
      'Marketing'
    ],
    ethnicities: ['Kinh', 'Tày', 'Thái', 'Mường', 'Khơ Me', 'H\'Mông', 'Nùng', 'Hoa', 'Dao', 'Gia Rai', 'Ê Đê', 'Ba Na', 'Xơ Đăng', 'Sán Chay', 'Cơ Ho', 'Chăm', 'Sán Dìu', 'Hrê', 'Mnông', 'Ra Glai', 'Xtiêng', 'Bru-Vân Kiều', 'Thổ', 'Giáy', 'Cơ Tu', 'Giẻ Triêng', 'Mạ', 'Khơ Mú', 'Co', 'Tà Ôi', 'Chơ Ro', 'Kháng', 'Xinh Mun', 'Hà Nhì', 'Chu Ru', 'Lào', 'La Chí', 'La Ha', 'Phù Lá', 'La Hủ', 'Lự', 'Lô Lô', 'Chứt', 'Mảng', 'Pà Thẻn', 'Cơ Lao', 'Cống', 'Bố Y', 'Si La', 'Pu Péo', 'Rơ Măm', 'Brâu', 'Ơ Đu'],
    religions: ['Không', 'Phật giáo', 'Công giáo', 'Tin lành', 'Cao đài', 'Hòa hảo', 'Hồi giáo', 'Tôn giáo khác']
  },
  activities: []
};

interface FormConfigContextType {
  config: FormConfig;
  updateConfig: (newConfig: Partial<FormConfig>) => Promise<void>;
  loading: boolean;
}

const FormConfigContext = createContext<FormConfigContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: async () => {},
  loading: true
});

export const useFormConfig = () => useContext(FormConfigContext);

export const FormConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<FormConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'formConfig');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...docSnap.data() } as FormConfig);
      } else {
        // Use DEFAULT_CONFIG in memory if it doesn't exist in Firestore
        setConfig(DEFAULT_CONFIG);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'settings/formConfig');
      } catch (e) {
        // Ignore thrown error to prevent app crash
      }
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (newConfig: Partial<FormConfig>) => {
    try {
      const docRef = doc(db, 'settings', 'formConfig');
      const updatedConfig = { ...config, ...newConfig };
      await setDoc(docRef, updatedConfig);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/formConfig');
    }
  };

  return (
    <FormConfigContext.Provider value={{ config, updateConfig, loading }}>
      {children}
    </FormConfigContext.Provider>
  );
};

import React, { useState } from 'react';
import { CompactPicker } from 'react-color'

export default function ColorPicker({ initialColor, onChange }) {
    const [color, setColor] = useState(initialColor || '#FFF');
    const [openPicker, setOpenPicker] = useState(false);
    const pickerZindex = 15;
    return <>
        {openPicker && (
            // picker 바깥 클릭시 자동으로 닫기
            <div
                style={{
                    position: 'fixed',
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                    zIndex: 5   // ColorPicker보다 낮아야 함
                }}
                onClick={() => setOpenPicker(false)}
            ></div>
        )}
        {/* 테마 컬러 선택박스와 충돌나지 않도록 zIndex 조절 */}
        <div className="color-box-wrap" style={{ zIndex: 1 }}>

            <div className="color-box">
                <a
                    className="topH_colorSbox ui-link"
                    style={{ zIndex: 1 }}
                    onClick={() => setOpenPicker(state => !state)}
                >
                    <span style={{ backgroundColor: color, border: '1px solid #999' }} />
                </a>
            </div>
        </div>
        {openPicker && (
            <div style={{ position: 'absolute', zIndex: pickerZindex, right: 10 }}>
                <CompactPicker
                    color={color}
                    className="ColorPicker"
                    wra
                    onChangeComplete={(newColor) => {
                        onChange?.(newColor.hex);
                        setColor(newColor.hex);
                        setOpenPicker(false);
                    }}
                />
            </div>
        )}
    </>
}
export const textNormalization = (text: string) => {
    if (!text) return '';

    return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/[^a-z0-9]/g, ''); 
};
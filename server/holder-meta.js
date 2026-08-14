/**
 * Honest holder metadata. A licensed DMB/MMO adapter replaces this later.
 * Never name a bank. Never claim this prototype holds client money.
 */
export const HOLDER_INFO = Object.freeze({
    liveRails: false,
    holdsClientMoney: false,
    holder: 'prototype',
    intendedAfter: 'licensed-dmb-mmo-letter',
    provider: 'mock',
    note: 'This prototype does not hold client money. Intended after a licensed DMB or MMO letter. Not live.',
})

export function decorateHold(record) {
    return {
        ...record,
        liveRails: false,
        holdsClientMoney: false,
        holder: 'prototype',
        intendedAfter: 'licensed-dmb-mmo-letter',
        provider: record.provider || 'mock',
    }
}

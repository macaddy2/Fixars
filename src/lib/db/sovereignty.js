import { supabase } from '@/lib/supabase'

/**
 * KYC tiers (mirrors engine guards.js ladder):
 *   0 none · 1 phone (self-assert) · 2 NIN/BVN (compliance-port ref) · 3 ops-only
 */

export const KYC_LABELS = {
    0: 'Unverified',
    1: 'Phone verified',
    2: 'NIN/BVN verified',
    3: 'Fully verified',
}

/** Pure: what the user can do next from their current tier. */
export function nextKycStep(tier = 0) {
    if (tier <= 0) return { action: 'phone', label: 'Verify phone', selfServe: true }
    if (tier === 1) return { action: 'nin-bvn', label: 'Upgrade with NIN/BVN reference', selfServe: true, needsRef: true }
    if (tier === 2) return { action: 'none', label: 'Tier 3 requires an operator review', selfServe: false }
    return { action: 'done', label: 'Fully verified', selfServe: false }
}

export async function setKycTier(level, ref) {
    const { data, error } = await supabase.rpc('set_kyc_tier', {
        p_level: level,
        p_ref: ref || null,
    })
    if (error) throw error
    return Number(data)
}

export async function exportMyData() {
    const { data, error } = await supabase.rpc('export_my_data')
    if (error) throw error
    return data
}

export async function deleteMyContent() {
    const { data, error } = await supabase.rpc('delete_my_content')
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    return {
        posts: Number(row?.posts_deleted || 0),
        comments: Number(row?.comments_deleted || 0),
        votes: Number(row?.votes_deleted || 0),
        notifications: Number(row?.notifications_deleted || 0),
    }
}

/** Trigger a JSON download of an export without leaving the page. */
export function downloadExport(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fixars-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
}

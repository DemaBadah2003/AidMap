'use client'

import { useMemo, useState, type ChangeEvent } from 'react'

import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog'

import { Pencil, Trash2, Save, X, Plus, Search } from 'lucide-react'

type Address = {
  id: string
  governorate: string
  city: string
  district: string
  street: string
}

const addressSeed: Address[] = [
  {
    id: 'ad_01',
    governorate: 'غزة',
    city: 'غزة',
    district: 'الرمال',
    street: 'شارع الوحدة',
  },
  {
    id: 'ad_02',
    governorate: 'خانيونس',
    city: 'خانيونس',
    district: 'بني سهيلا',
    street: 'شارع البحر',
  },
]

export default function AddressPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Address[]>(addressSeed)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)

  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [street, setStreet] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Address>({
    id: '',
    governorate: '',
    city: '',
    district: '',
    street: '',
  })

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter(
      (a) =>
        !s ||
        a.governorate.toLowerCase().includes(s) ||
        a.city.toLowerCase().includes(s) ||
        a.district.toLowerCase().includes(s) ||
        a.street.toLowerCase().includes(s)
    )
  }, [q, items])

  useMemo(() => {
    setPage(1)
  }, [q, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = () => {
    if (!governorate || !city || !district || !street) return

    const newItem: Address = {
      id: `ad_${Math.random().toString(16).slice(2, 8)}`,
      governorate,
      city,
      district,
      street,
    }

    setItems((prev) => [newItem, ...prev])
    setGovernorate('')
    setCity('')
    setDistrict('')
    setStreet('')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (a: Address) => {
    setEditingId(a.id)
    setEditDraft(a)
  }

  const saveEditRow = () => {
    setItems((prev) =>
      prev.map((a) => (a.id === editingId ? editDraft : a))
    )
    setEditingId(null)
  }

  const cancelEditRow = () => setEditingId(null)

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6">
      <div className="mb-6">
        <div className="text-2xl font-semibold">Address</div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0">
            {/* Toolbar */}
            <div className="p-4 flex justify-between">
              <div className="relative w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setQ(e.target.value)
                  }
                  placeholder="Search address"
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add address
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setItems([])}
                >
                  Delete all
                </Button>
              </div>
            </div>

            <div className="border-t" />

            {/* Table */}
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 border">Governorate</th>
                  <th className="px-4 py-3 border">City</th>
                  <th className="px-4 py-3 border">District</th>
                  <th className="px-4 py-3 border">Street</th>
                  <th className="px-4 py-3 border">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((a) => {
                  const isEditing = editingId === a.id

                  return (
                    <tr key={a.id}>
                      <td className="border px-4 py-2">
                        {isEditing ? (
                          <Input
                            value={editDraft.governorate}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                governorate: e.target.value,
                              })
                            }
                          />
                        ) : (
                          a.governorate
                        )}
                      </td>

                      <td className="border px-4 py-2">
                        {isEditing ? (
                          <Input
                            value={editDraft.city}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                city: e.target.value,
                              })
                            }
                          />
                        ) : (
                          a.city
                        )}
                      </td>

                      <td className="border px-4 py-2">
                        {isEditing ? (
                          <Input
                            value={editDraft.district}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                district: e.target.value,
                              })
                            }
                          />
                        ) : (
                          a.district
                        )}
                      </td>

                      <td className="border px-4 py-2">
                        {isEditing ? (
                          <Input
                            value={editDraft.street}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                street: e.target.value,
                              })
                            }
                          />
                        ) : (
                          a.street
                        )}
                      </td>

                      <td className="border px-4 py-2 flex gap-2">
                        {!isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => startEditRow(a)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDeleteOne(a.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" onClick={saveEditRow}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditRow}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between p-4 border-t">
              <div>
                {rangeStart} - {rangeEnd} of {filtered.length}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
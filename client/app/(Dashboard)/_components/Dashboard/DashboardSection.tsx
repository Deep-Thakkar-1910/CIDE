"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { FolderCode, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import axios from "@/lib/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RoomFilterDialog } from "../Room/RoomFilterDialog";
import { CreateRoomModal } from "../Misc/CreateRoomModal";
import { RoomCard } from "../Room/RoomCard";
import { RoomsPagination } from "../Room/RoomPagination";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { DashboardSkeleton } from "./DashboardSkeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSearchParams } from "next/navigation";

// Fetch room api with search and filter
const fetchRooms = async ({
  pageParam = 1,
  search = "",
  language = "",
  type = "",
}) => {
  try {
    const lowerCaseSearchForCache = search.toLowerCase().trim();
    const result = await axios.get(
      `/getrooms?page=${pageParam}&search=${lowerCaseSearchForCache}&language=${language}&type=${type}`,
    );

    if (result.data.success) {
      return result.data;
    }

    return null;
  } catch (err) {
    if (err instanceof AxiosError) {
      toast.error(err.response?.data?.error || "Failed to fetch rooms");
    }
    return null;
  }
};

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebounce(searchInput, 500);

  const [filters, setFilters] = useState({
    language: "",
    type: "",
  });

  const searchParams = useSearchParams();
  const errorToShow = searchParams.get("error");

  useEffect(() => {
    if (errorToShow) {
      toast.error(errorToShow);
      window.history.pushState({}, "", window.location.pathname); // remove the error query param from the url
    }
  }, [errorToShow]); // if error messages are present in the url, show them as toast and then remove them from the url to prevent showing them again on refresh

  const [, startTransition] = useTransition();
  const { data: session, isPending } = authClient.useSession();

  const normalizedSearch = search.trim().toLowerCase();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    hasPreviousPage,
    isFetching,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [
      "rooms",
      {
        search: normalizedSearch,
        language: filters.language,
        roomType: filters.type,
      }, // merge the combinations for clean caching
    ],
    queryFn: ({ pageParam }) =>
      fetchRooms({
        pageParam,
        search: normalizedSearch,
        language: filters.language,
        type: filters.type,
      }), // fetch rooms with current filters
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined; // return undefined if on last page to help with pagination
    },
    getPreviousPageParam: (firstPage) => {
      const { page } = firstPage.meta;
      return page > 1 ? page - 1 : undefined; // return undefined if on first page to help with pagination
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false, // to prevent refetching on tab switches if data is fresh
    refetchOnWindowFocus: false,
  });

  const totalPages = data?.pages[0]?.meta.totalPages ?? 1;

  const allRooms = useMemo(() => {
    return data?.pages.flatMap((p) => p.data) ?? []; // getting the rooms from each page and flattening it out in an array
  }, [data]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    const loadedPagesCount = data?.pages.length ?? 0;

    if (page > currentPage && page > loadedPagesCount && hasNextPage) {
      startTransition(() => {
        fetchNextPage(); // allow switching page if current api call is pedning
      });
    }
    setCurrentPage(page);
  };

  if (isPending || isFetching) return <DashboardSkeleton />;

  return (
    <section className="mx-auto w-[80%] max-w-6xl py-8 lg:w-full lg:place-self-start">
      {/* Greeting */}
      <div className="mb-12 flex flex-col items-start justify-between gap-y-4 lg:flex-row">
        <div>
          <h1 className="text-4xl font-bold">
            Welcome back{" "}
            <span className="text-primary">{session?.user.name}</span>
          </h1>
          <p className="text-muted-foreground">
            {allRooms.length === 0
              ? "Create your first collaborative session"
              : `You have ${data?.pages[0]?.meta.total} active ${allRooms.length === 1 ? "room" : "rooms"}`}
          </p>
        </div>
        {/* Search + Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Input
            type="text"
            placeholder="Search rooms..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className=""
          />

          <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
            Filters
          </Button>
        </div>
      </div>

      {/* Create Button */}
      {allRooms.length > 0 && !isLoading && (
        <div className="mb-8">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer gap-2"
          >
            <Plus className="h-5 w-5" />
            Create New Room
          </Button>
        </div>
      )}

      {/* Grid */}
      {allRooms.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {allRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          <RoomsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        !isLoading && (
          <Empty className="border-border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderCode />
              </EmptyMedia>
              <EmptyTitle className="text-muted-foreground">
                No Rooms Yet
              </EmptyTitle>
              <EmptyDescription className="text-muted-foreground text-sm">
                Create a new collaborative room to start coding together
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer"
              >
                Create Your First Room
              </Button>
            </EmptyContent>
          </Empty>
        )
      )}

      <RoomFilterDialog
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentLanguage={filters.language}
        currentType={filters.type}
        onApply={(newFilters) => {
          setCurrentPage(1);
          setFilters(newFilters);
        }}
      />

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
